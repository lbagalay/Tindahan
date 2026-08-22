const isVercelBuild = process.env.VERCEL === "1";

if (isVercelBuild) {
  const requiredVariables = ["DATABASE_URL", "AUTH_SECRET", "AUTH_TRUST_HOST"];
  const missingVariables = requiredVariables.filter((name) => !process.env[name]?.trim());

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required Vercel environment variables: ${missingVariables.join(", ")}. ` +
        "Add them to both Production and Preview before redeploying.",
    );
  }

  let databaseUrl;
  try {
    databaseUrl = new URL(process.env.DATABASE_URL);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
    throw new Error("DATABASE_URL must use the postgres:// or postgresql:// protocol.");
  }

  const databaseHost = databaseUrl.hostname.toLowerCase();
  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);
  if (localHosts.has(databaseHost) || databaseHost.endsWith(".local")) {
    throw new Error(
      "DATABASE_URL points to a local computer. Vercel requires a hosted PostgreSQL database.",
    );
  }

  if (process.env.AUTH_SECRET.length < 32 || process.env.AUTH_SECRET === "replace-with-a-random-secret") {
    throw new Error("AUTH_SECRET must be a random value containing at least 32 characters.");
  }

  if (!new Set(["true", "1"]).has(process.env.AUTH_TRUST_HOST.toLowerCase())) {
    throw new Error('AUTH_TRUST_HOST must be set to "true" on Vercel.');
  }
}
