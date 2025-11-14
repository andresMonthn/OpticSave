"use client"

export function getCachedUserId(): string | null {
  try {
    return typeof window !== "undefined" ? localStorage.getItem("optisave_user_id") : null;
  } catch {
    return null;
  }
}

export function setCachedUserId(userId: string) {
  try {
    if (typeof window !== "undefined") localStorage.setItem("optisave_user_id", userId);
  } catch {
    // ignore
  }
}