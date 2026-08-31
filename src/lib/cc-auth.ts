import { useEffect, useState } from "react";

export type CCRole = "admin" | "user";
export type CCUser = { name: string; email: string; phone?: string; role?: CCRole };
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
  userEmail?: string;
  userName?: string;
};
export type CCCertificate = {
  id: string;
  month: string;
  score: number;
  level: "Bronze" | "Prata" | "Ouro";
  userEmail?: string;
  userName?: string;
  issuedAt?: string;
};

const USER_KEY = "cc:user";
const USERS_KEY = "cc:users";
const SCHED_KEY = "cc:schedules";
const CERT_KEY = "cc:certs";

type StoredUser = CCUser & { password: string };

const ADMIN_EMAIL = "admin@cleanconnect.mz";
const ADMIN_PASSWORD = "admin123";

function ensureAdmin() {
  const users = safeGet<StoredUser[]>(USERS_KEY, []);
  if (!users.some((u) => u.email.toLowerCase() === ADMIN_EMAIL)) {
    users.push({
      name: "Administrador",
      email: ADMIN_EMAIL,
      phone: "",
      role: "admin",
      password: ADMIN_PASSWORD,
    });
    safeSet(USERS_KEY, users);
  }
}

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
  ensureAdmin();
  const users = safeGet<StoredUser[]>(USERS_KEY, []);
  const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase());
  if (!u || u.password !== password) throw new Error("Credenciais inválidas");
  const pub: CCUser = { name: u.name, email: u.email, phone: u.phone, role: u.role ?? "user" };
  safeSet(USER_KEY, pub);
  window.dispatchEvent(new Event("cc:auth"));
  return pub;
}

export function register(input: CCUser & { password: string }): CCUser {
  const users = safeGet<StoredUser[]>(USERS_KEY, []);
  if (users.some((x) => x.email.toLowerCase() === input.email.toLowerCase()))
    throw new Error("Já existe uma conta com este email");
  users.push({ ...input, role: "user" });
  safeSet(USERS_KEY, users);
  const pub: CCUser = { name: input.name, email: input.email, phone: input.phone, role: "user" };
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
  const u = getUser();
  list.unshift({
    ...s,
    id: crypto.randomUUID(),
    status: "Pendente",
    value: "250 MZN",
    createdAt: new Date().toISOString(),
    userEmail: s.userEmail ?? u?.email,
    userName: s.userName ?? u?.name,
  });
  safeSet(SCHED_KEY, list);
  window.dispatchEvent(new Event("cc:data"));
}

function requireAdmin() {
  if (!isAdmin(getUser())) throw new Error("Acesso negado: apenas administradores");
}

export function updateScheduleStatus(id: string, status: CCSchedule["status"]) {
  requireAdmin();
  const list = getSchedules().map((s) => (s.id === id ? { ...s, status } : s));
  safeSet(SCHED_KEY, list);
  window.dispatchEvent(new Event("cc:data"));
}
export function deleteSchedule(id: string) {
  requireAdmin();
  safeSet(SCHED_KEY, getSchedules().filter((s) => s.id !== id));
  window.dispatchEvent(new Event("cc:data"));
}
export function getCertificates(): CCCertificate[] {
  return safeGet<CCCertificate[]>(CERT_KEY, []);
}

export function issueCertificate(c: Omit<CCCertificate, "id" | "issuedAt">) {
  requireAdmin();
  const list = getCertificates();
  list.unshift({ ...c, id: crypto.randomUUID(), issuedAt: new Date().toISOString() });
  safeSet(CERT_KEY, list);
  window.dispatchEvent(new Event("cc:data"));
}
export function deleteCertificate(id: string) {
  requireAdmin();
  safeSet(CERT_KEY, getCertificates().filter((c) => c.id !== id));
  window.dispatchEvent(new Event("cc:data"));
}

export function getAllUsers(): CCUser[] {
  requireAdmin();
  ensureAdmin();
  return safeGet<StoredUser[]>(USERS_KEY, []).map((u) => ({
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role ?? "user",
  }));
}
export function deleteUser(email: string) {
  const users = safeGet<StoredUser[]>(USERS_KEY, []).filter(
    (u) => u.email.toLowerCase() !== email.toLowerCase(),
  );
  safeSet(USERS_KEY, users);
  window.dispatchEvent(new Event("cc:data"));
}

export function isAdmin(u: CCUser | null) {
  return u?.role === "admin";
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