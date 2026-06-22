import { useEffect, useState } from "react";

export type CCUser = { name: string; email: string; phone?: string };
export type CCSchedule = {
  id: string;
  type: string;
  qty: string;
  date: string;
  time: string;
  location: string;
  notes?: string;
  status: "Pendente" | "Concluído" | "Cancelado";
  value: string;
  createdAt: string;
};
export type CCCertificate = {
  id: string;
  month: string;
  score: number;
  level: "Bronze" | "Prata" | "Ouro";
};

const USER_KEY = "cc:user";
const USERS_KEY = "cc:users";
const SCHED_KEY = "cc:schedules";
const CERT_KEY = "cc:certs";

type StoredUser = CCUser & { password: string };

function safeGet<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try {
    const v = window.localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fb;
  } catch {
    return fb;
  }
}
function safeSet<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

export function getUser(): CCUser | null {
  return safeGet<CCUser | null>(USER_KEY, null);
}

export function login(email: string, password: string): CCUser {
  const users = safeGet<StoredUser[]>(USERS_KEY, []);
  const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase());
  if (!u || u.password !== password) throw new Error("Credenciais inválidas");
  const pub: CCUser = { name: u.name, email: u.email, phone: u.phone };
  safeSet(USER_KEY, pub);
  window.dispatchEvent(new Event("cc:auth"));
  return pub;
}

export function register(input: CCUser & { password: string }): CCUser {
  const users = safeGet<StoredUser[]>(USERS_KEY, []);
  if (users.some((x) => x.email.toLowerCase() === input.email.toLowerCase()))
    throw new Error("Já existe uma conta com este email");
  users.push(input);
  safeSet(USERS_KEY, users);
  const pub: CCUser = { name: input.name, email: input.email, phone: input.phone };
  safeSet(USER_KEY, pub);
  window.dispatchEvent(new Event("cc:auth"));
  return pub;
}

export function logout() {
  if (typeof window !== "undefined") window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("cc:auth"));
}

export function useUser() {
  const [user, setUser] = useState<CCUser | null>(null);
  useEffect(() => {
    setUser(getUser());
    const h = () => setUser(getUser());
    window.addEventListener("cc:auth", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("cc:auth", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return user;
}

// ----- Schedules -----
export function getSchedules(): CCSchedule[] {
  return safeGet<CCSchedule[]>(SCHED_KEY, []);
}
export function addSchedule(s: Omit<CCSchedule, "id" | "status" | "value" | "createdAt">) {
  const list = getSchedules();
  list.unshift({
    ...s,
    id: crypto.randomUUID(),
    status: "Pendente",
    value: "250 MZN",
    createdAt: new Date().toISOString(),
  });
  safeSet(SCHED_KEY, list);
  window.dispatchEvent(new Event("cc:data"));
}
export function getCertificates(): CCCertificate[] {
  return safeGet<CCCertificate[]>(CERT_KEY, []);
}

function ensureSeed() {
  // No seed data — novos utilizadores começam do zero.
}

export function useStoreData<T>(fn: () => T): T {
  const [v, setV] = useState<T>(fn);
  useEffect(() => {
    setV(fn());
    const h = () => setV(fn());
    window.addEventListener("cc:data", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("cc:data", h);
      window.removeEventListener("storage", h);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}