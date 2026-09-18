import type { Role } from "./types";

export type Door = "inbox" | "crm";

function key(userId: string) {
  return `bgd-door:${userId}`;
}

export function defaultDoor(role: Role | null): Door {
  if (role === "supervisor" || role === "admin") return "crm";
  return "inbox";
}

export function readDoor(userId: string | undefined, role: Role | null): Door {
  if (!userId || typeof window === "undefined") return defaultDoor(role);
  try {
    const raw = window.localStorage.getItem(key(userId));
    if (raw === "inbox" || raw === "crm") return raw;
  } catch {
    /* private mode */
  }
  return defaultDoor(role);
}

export function writeDoor(userId: string, door: Door) {
  try {
    window.localStorage.setItem(key(userId), door);
  } catch {
    /* private mode */
  }
}
