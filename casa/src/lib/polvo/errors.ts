/** Client-safe error text from server functions, fetch failures, and auth. */
export function polvoError(err: unknown): string {
  const raw = unwrap(err);
  if (!raw) return "Algo deu errado. Tenta de novo.";
  if (raw === "Unauthorized") return "Sessão expirada. Entre de novo.";
  if (/failed to fetch|networkerror|load failed/i.test(raw)) {
    return "Falha de rede. Tenta de novo.";
  }
  return raw;
}

export function isUnauthorized(err: unknown): boolean {
  return unwrap(err) === "Unauthorized";
}

function unwrap(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err.trim();
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  if (typeof err === "object" && "message" in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  }
  return "";
}
