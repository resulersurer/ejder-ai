import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { getDatabaseUrl, safeDatabaseError } from "../lib/database/config";

test("database config rejects missing and redacted secrets without exposing URLs", () => {
  assert.throws(() => getDatabaseUrl({}), /DATABASE_URL/);
  assert.throws(
    () => getDatabaseUrl({ DATABASE_URL: "[SENSITIVE]" }),
    /Sensitive/,
  );
  assert.throws(
    () =>
      getDatabaseUrl({ DATABASE_URL: "https://user:secret@example.com/db" }),
    (error: unknown) =>
      error instanceof Error && !error.message.includes("secret"),
  );
  assert.throws(
    () =>
      getDatabaseUrl({
        DATABASE_URL: "postgres://user:secret@example.com/db?sslmode=disable",
      }),
    /TLS/,
  );
  const url = "postgresql://test:local@example.neon.tech/test?sslmode=require";
  assert.equal(getDatabaseUrl({ DATABASE_URL: url }), url);
  assert.equal(
    safeDatabaseError({ code: "23505", message: url }),
    "Veritabanı işlemi başarısız (SQLSTATE 23505).",
  );
  assert.equal(safeDatabaseError(new Error(url)).includes(url), false);
});

test("PostgreSQL schema enforces identity, references and demo isolation", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(
      await readFile(
        new URL("../database/migrations/001_initial.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(
      await readFile(
        new URL(
          "../database/migrations/002_tour_ai_configurations.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const leadId = randomUUID();
    const callId = randomUUID();
    const demoLeadId = randomUUID();
    const demoCallId = randomUUID();
    const anotherLeadId = randomUUID();
    const sqlState = (code: string) => (error: unknown) =>
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === code;
    async function addLead(id: string, sourceId: string, isDemo = false) {
      return db.query(
        "INSERT INTO ejder_ai.leads (id, code, source, external_source_id, full_name, phone, tour_name, is_demo) VALUES ($1, $2, 'TURTAKIP', $3, 'Test Misafir', '05000000000', 'Test Tur', $4)",
        [id, `LEAD-${id}`, sourceId, isDemo],
      );
    }
    async function addDraft(
      id: string,
      lead: string,
      call: string,
      isDemo = false,
    ) {
      return db.query(
        "INSERT INTO ejder_ai.reservation_drafts (id, code, lead_id, call_id, departure_id, departure_label, passengers, is_demo) VALUES ($1, $2, $3, $4, 'departure-test', 'Test kalkış', '[\"Test Misafir\"]', $5)",
        [id, `DRAFT-${id}`, lead, call, isDemo],
      );
    }
    await addLead(leadId, "source-1");
    await addLead(demoLeadId, "demo-source", true);
    await addLead(anotherLeadId, "source-2");
    await db.query(
      "INSERT INTO ejder_ai.calls (id, lead_id, provider, outcome, summary) VALUES ($1, $2, 'MANUAL', 'QUALIFIED', 'Test görüşme sonucu')",
      [callId, leadId],
    );
    await db.query(
      "INSERT INTO ejder_ai.calls (id, lead_id, provider, outcome, summary, is_demo) VALUES ($1, $2, 'MANUAL', 'QUALIFIED', 'Demo görüşme sonucu', true)",
      [demoCallId, demoLeadId],
    );

    await t.test(
      "replayed TurTakip lead cannot create another record",
      async () => {
        await assert.rejects(
          addLead(randomUUID(), "source-1"),
          sqlState("23505"),
        );
      },
    );
    await t.test("negative passenger counts are rejected", async () => {
      await assert.rejects(
        db.query("UPDATE ejder_ai.leads SET child_count = -1 WHERE id = $1", [
          leadId,
        ]),
        sqlState("23514"),
      );
    });
    await t.test(
      "call must belong to the same lead and demo mode",
      async () => {
        await assert.rejects(
          addDraft(randomUUID(), anotherLeadId, callId),
          sqlState("23503"),
        );
        await assert.rejects(
          addDraft(randomUUID(), demoLeadId, demoCallId, false),
          sqlState("23503"),
        );
      },
    );
    await t.test("only a qualified result can create a draft", async () => {
      const negativeCallId = randomUUID();
      await db.query(
        "INSERT INTO ejder_ai.calls (id, lead_id, provider, outcome, summary) VALUES ($1, $2, 'MANUAL', 'NOT_INTERESTED', 'Seyahat planını erteledi')",
        [negativeCallId, anotherLeadId],
      );
      await assert.rejects(
        addDraft(randomUUID(), anotherLeadId, negativeCallId),
        sqlState("23503"),
      );
    });
    await t.test(
      "valid draft persists and duplicates are rejected",
      async () => {
        await addDraft(randomUUID(), leadId, callId);
        const result = await db.query<{ status: string }>(
          "SELECT status FROM ejder_ai.reservation_drafts WHERE lead_id = $1",
          [leadId],
        );
        assert.equal(result.rows[0].status, "DRAFT");
        await assert.rejects(
          addDraft(randomUUID(), leadId, callId),
          sqlState("23505"),
        );
      },
    );
    await t.test("demo draft cannot be queued for live transfer", async () => {
      await addDraft(randomUUID(), demoLeadId, demoCallId, true);
      await assert.rejects(
        db.query(
          "UPDATE ejder_ai.reservation_drafts SET status = 'PENDING_TRANSFER' WHERE lead_id = $1",
          [demoLeadId],
        ),
        sqlState("23514"),
      );
    });
    await t.test(
      "transferred draft needs a TurTakip reservation reference",
      async () => {
        await assert.rejects(
          db.query(
            "UPDATE ejder_ai.reservation_drafts SET status = 'TRANSFERRED' WHERE lead_id = $1",
            [leadId],
          ),
          sqlState("23514"),
        );
      },
    );
    await t.test(
      "tour AI configuration validates phone and upserts by tour",
      async () => {
        await assert.rejects(
          db.query(
            "INSERT INTO ejder_ai.tour_ai_configurations (turtakip_tour_id, tour_name, tour_slug, phone_number, ai_agent_key, ai_display_name) VALUES ('tour-bad', 'Test Tur', 'test-tur', '08501234567', 'SALES', 'Satış danışmanı')",
          ),
          sqlState("23514"),
        );
        await db.query(
          "INSERT INTO ejder_ai.tour_ai_configurations (turtakip_tour_id, tour_name, tour_slug, phone_number, ai_agent_key, ai_display_name) VALUES ('tour-1', 'Test Tur', 'test-tur', '+908501234567', 'SALES', 'Satış danışmanı') ON CONFLICT (turtakip_tour_id) DO UPDATE SET phone_number = EXCLUDED.phone_number",
        );
        await db.query(
          "INSERT INTO ejder_ai.tour_ai_configurations (turtakip_tour_id, tour_name, tour_slug, phone_number, ai_agent_key, ai_display_name) VALUES ('tour-1', 'Test Tur', 'test-tur', '+908509876543', 'SALES', 'Satış danışmanı') ON CONFLICT (turtakip_tour_id) DO UPDATE SET phone_number = EXCLUDED.phone_number",
        );
        const result = await db.query<{ phone_number: string }>(
          "SELECT phone_number FROM ejder_ai.tour_ai_configurations WHERE turtakip_tour_id = 'tour-1'",
        );
        assert.equal(result.rows.length, 1);
        assert.equal(result.rows[0].phone_number, "+908509876543");
      },
    );
  } finally {
    await db.close();
  }
});
