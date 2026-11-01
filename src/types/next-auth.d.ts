import type { DefaultSession } from "next-auth";

type ChurchUserRole = "MEMBER" | "EDITOR" | "ADMIN" | "SUPER_ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: ChurchUserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: ChurchUserRole;
    authVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: ChurchUserRole;
    authVersion?: number;
  }
}
