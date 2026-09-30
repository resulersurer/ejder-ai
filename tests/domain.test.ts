import assert from "node:assert/strict";
import test from "node:test";
import { createDemoState } from "../lib/demo-data";
import {
  demoDepartures,
  filterLeads,
  leadInputSchema,
  transition,
  workspaceSchema,
  type Reservation,
} from "../lib/domain";

function draft(): Reservation {
  return {
    id: "draft-test",
    code: "TAS-TEST",
    leadId: "demo-lead-3",
    callId: "demo-call-1",
    departureId: demoDepartures[3].id,
    departureLabel: demoDepartures[3].label,
    passengers: ["Demo Misafir", "Örnek Yolcu"],
    createdAt: "2026-09-30T12:00:00.000Z",
    status: "LOCAL_DRAFT",
    isDemo: true,
  };
}

test("demo data satisfies storage schema and cannot be mistaken for live records", () => {
  const state = createDemoState();
  assert.equal(workspaceSchema.safeParse(state).success, true);
  const invalid = structuredClone(state);
  Reflect.set(invalid.leads[0], "isDemo", false);
  assert.equal(workspaceSchema.safeParse(invalid).success, false);
});

test("lead input normalizes Turkish mobile numbers and rejects invalid fields", () => {
  const lead = createDemoState().leads[0];
  assert.equal(
    leadInputSchema.parse({ ...lead, phone: "+90 (500) 000 00 00" }).phone,
    "+905000000000",
  );
  assert.equal(
    leadInputSchema.safeParse({ ...lead, phone: "123" }).success,
    false,
  );
  assert.equal(
    leadInputSchema.safeParse({ ...lead, adultCount: 0 }).success,
    false,
  );
  assert.equal(
    leadInputSchema.safeParse({ ...lead, childCount: -1 }).success,
    false,
  );
  assert.equal(
    leadInputSchema.safeParse({ ...lead, email: "wrong" }).success,
    false,
  );
});

test("new lead can be queued, qualified, and drafted without mutating original data", () => {
  const original = createDemoState();
  let state = transition(original, { type: "QUEUE", leadId: "demo-lead-1" });
  assert.equal(state.leads[0].status, "QUEUED");
  assert.equal(original.leads[0].status, "NEW");
  state = transition(state, {
    type: "RECORD_CALL",
    call: {
      id: "test-call",
      leadId: "demo-lead-1",
      outcome: "QUALIFIED",
      summary: "İki kişilik rezervasyon istiyor.",
      createdAt: "2026-09-30T12:00:00.000Z",
      isDemo: true,
    },
  });
  state = transition(state, {
    type: "CREATE_DRAFT",
    reservation: {
      ...draft(),
      leadId: "demo-lead-1",
      callId: "test-call",
      departureId: demoDepartures[0].id,
      departureLabel: demoDepartures[0].label,
    },
  });
  assert.equal(state.leads[0].status, "DRAFT");
  assert.equal(state.reservations.length, 1);
  assert.equal(workspaceSchema.safeParse(state).success, true);
});

test("draft requires a qualified outcome, matching tour, latest call and full passenger list", () => {
  const state = createDemoState();
  assert.throws(
    () =>
      transition(state, {
        type: "CREATE_DRAFT",
        reservation: { ...draft(), leadId: "demo-lead-1" },
      }),
    /Önce/,
  );
  assert.throws(
    () =>
      transition(state, {
        type: "CREATE_DRAFT",
        reservation: {
          ...draft(),
          departureId: demoDepartures[0].id,
          departureLabel: demoDepartures[0].label,
        },
      }),
    /uygun/,
  );
  assert.throws(
    () =>
      transition(state, {
        type: "CREATE_DRAFT",
        reservation: { ...draft(), callId: "missing" },
      }),
    /Son görüşme/,
  );
  assert.throws(
    () =>
      transition(state, {
        type: "CREATE_DRAFT",
        reservation: { ...draft(), passengers: ["Demo Misafir"] },
      }),
    /Her yolcu/,
  );
});

test("repeated draft actions cannot create duplicate reservations", () => {
  const state = transition(createDemoState(), {
    type: "CREATE_DRAFT",
    reservation: draft(),
  });
  const repeated = transition(state, {
    type: "CREATE_DRAFT",
    reservation: { ...draft(), id: "second-id" },
  });
  assert.equal(repeated, state);
  assert.equal(repeated.reservations.length, 1);
  assert.throws(
    () => transition(state, { type: "QUEUE", leadId: "demo-lead-3" }),
    /sıraya alınamaz/,
  );
  assert.throws(
    () =>
      transition(state, {
        type: "RECORD_CALL",
        call: {
          ...state.calls[0],
          id: "another-call",
          outcome: "NOT_INTERESTED",
        },
      }),
    /sonuç değiştirilemez/,
  );
});

test("later negative outcome prevents drafting an earlier qualified call", () => {
  const state = transition(createDemoState(), {
    type: "RECORD_CALL",
    call: {
      id: "negative-call",
      leadId: "demo-lead-3",
      outcome: "NOT_INTERESTED",
      summary: "Planını ertelediğini belirtti.",
      createdAt: "2026-09-30T12:00:00.000Z",
      isDemo: true,
    },
  });
  assert.throws(
    () => transition(state, { type: "CREATE_DRAFT", reservation: draft() }),
    /Önce/,
  );
});

test("Turkish search combines status and source filters", () => {
  const leads = createDemoState().leads;
  assert.equal(filterLeads(leads, "ELİF", "NEW", "TurTakip formu").length, 1);
  assert.equal(filterLeads(leads, "ELİF", "QUALIFIED", "ALL").length, 0);
  assert.equal(filterLeads(leads, "Balkan", "NEW", "ALL").length, 2);
  assert.equal(filterLeads(leads, "", "ALL", "Manuel kayıt").length, 0);
});

test("corrupt references and duplicate identifiers are rejected on restore", () => {
  const broken = createDemoState();
  broken.calls[0].leadId = "missing";
  assert.equal(workspaceSchema.safeParse(broken).success, false);
  const duplicate = createDemoState();
  duplicate.leads.push(duplicate.leads[0]);
  assert.equal(workspaceSchema.safeParse(duplicate).success, false);
});
