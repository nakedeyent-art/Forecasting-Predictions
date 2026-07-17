export type AuthContext = {
  userId: string | null;
};

export async function getAuthContext(): Promise<AuthContext> {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const session = await auth();
    return { userId: session.userId ?? null };
  } catch {
    return { userId: null };
  }
}

export function authRequired(): boolean {
  return process.env.ORACLE_REQUIRE_AUTH === "true";
}
