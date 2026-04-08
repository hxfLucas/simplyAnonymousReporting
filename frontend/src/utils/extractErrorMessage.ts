export function extractErrorMessage(err: unknown, fallback: string): string {
  const e = err as any;
  return (
    e?.response?.data?.message ??
    e?.response?.data?.error ??
    e?.message ??
    fallback
  );
}
