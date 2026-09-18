import { useCallback, useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { polvoError } from "./errors";
import { bootstrapSession } from "./server";
import type { SessionPayload } from "./types";

export function usePolvoSession() {
  const { user, isPending } = useCurrentUserState();
  const userId = user?.id ?? null;
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setSession(null);
      setError(null);
      setBooting(false);
      return;
    }
    setBooting(true);
    try {
      const payload = await bootstrapSession();
      setSession(payload);
      setError(null);
    } catch (err) {
      setSession(null);
      setError(polvoError(err));
    } finally {
      setBooting(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isPending) return;
    void refresh();
  }, [isPending, refresh]);

  return {
    user,
    isPending: isPending || (Boolean(userId) && booting && !session && !error),
    booting,
    session,
    error,
    refresh,
  };
}
