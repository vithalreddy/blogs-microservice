const { env } = process;

const nodeEnv = env.NODE_ENV || "dev";

module.exports = {
  env: nodeEnv,
  server: { port: env.PORT || 9002, host: env.HOST || `127.0.0.1` },
  database: {
    host: env.DB_URL || `localhost`,
    user: env.DB_USERNAME || "postgres",
    password: env.DB_PASSWORD || "p23p",
    database: env.DB_NAME || "blogger",
    debug: nodeEnv === "dev"
  },
  apiBaseUrl: `/api/v1`
};
