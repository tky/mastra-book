import { betterAuth } from "better-auth";
import { LibsqlDialect } from "@libsql/kysely-libsql";

export const auth = betterAuth({
  baseURL: process.env.BETER_AUTH_URL,
  trustedOrigins: [
    "http://localhost:3000",
    "https://localhost:3000",
    "https://*.app.github.dev",
  ],
  database: {
    dialect: new LibsqlDialect({
      url: "file:./auth.db",
    }),
    type: "sqlite",
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8
  },
  session: {
    expiresIn: 60 * 60 * 7,
    updateAge: 60 * 60 * 24
  }
});
