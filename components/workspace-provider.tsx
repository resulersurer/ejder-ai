"use client";

import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createDemoState } from "@/lib/demo-data";
import {
  transition,
  workspaceSchema,
  type Action,
  type WorkspaceState,
} from "@/lib/domain";

const STORAGE_KEY = "ejder-ai-demo-v1";
type Snapshot = { state: WorkspaceState; error: string | null };
let snapshot: Snapshot | null = null;
const listeners = new Set<() => void>();
const fallbackState = createDemoState();

function load() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    snapshot = {
      state: saved
        ? workspaceSchema.parse(JSON.parse(saved))
        : createDemoState(),
      error: null,
    };
  } catch {
    snapshot = {
      state: createDemoState(),
      error:
        "Tarayıcı kayıtları okunamadı. Örnek veriler gösteriliyor. Kayıtları sıfırlayın veya tarayıcının depolama iznini kontrol edin.",
    };
  }
}
function notify() {
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!snapshot) {
    load();
    notify();
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      load();
      notify();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
const getSnapshot = () => snapshot;
const getServerSnapshot = () => null;

type WorkspaceContext = {
  state: WorkspaceState;
  ready: boolean;
  storageError: string | null;
  message: string;
  dispatch: (action: Action, success: string) => boolean;
  reset: () => boolean;
  dismissMessage: () => void;
};
const Context = createContext<WorkspaceContext | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const current = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [message, setMessage] = useState("");
  function save(state: WorkspaceState) {
    // Persist before publishing state: a failed write must never look successful.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    snapshot = { state, error: null };
    notify();
  }
  function dispatch(action: Action, success: string) {
    try {
      if (!snapshot || snapshot.error)
        throw new Error("Depolama sorunu çözülmeden değişiklik kaydedilemez.");
      save(transition(snapshot.state, action));
      setMessage(success);
      return true;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "İşlem kaydedilemedi.",
      );
      return false;
    }
  }
  function reset() {
    try {
      save(createDemoState());
      setMessage("Demo çalışma alanı başlangıç durumuna döndürüldü.");
      return true;
    } catch {
      setMessage(
        "Depolamaya erişilemiyor. Tarayıcı ayarlarınızı kontrol edin.",
      );
      return false;
    }
  }
  return (
    <Context.Provider
      value={{
        state: current?.state ?? fallbackState,
        ready: current !== null,
        storageError: current?.error ?? null,
        message,
        dispatch,
        reset,
        dismissMessage: () => setMessage(""),
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(Context);
  if (!context) throw new Error("Çalışma alanı sağlayıcısı bulunamadı.");
  return context;
}
