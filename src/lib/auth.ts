import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      name: "Email and Password",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";

        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";

        if (!email || !password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash || !user.isActive) {
          return null;
        }

        const passwordMatches = await compare(
          password,
          user.passwordHash,
        );

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          authVersion: user.authVersion,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.authVersion = user.authVersion;
      }

      if (
        typeof token.id !== "string" ||
        token.id.length === 0 ||
        typeof token.authVersion !== "number"
      ) {
        return null;
      }

      const currentUser = await db.user.findUnique({
        where: { id: token.id },
        select: {
          isActive: true,
          authVersion: true,
          role: true,
        },
      });

      if (
        !currentUser ||
        !currentUser.isActive ||
        currentUser.authVersion !== token.authVersion
      ) {
        return null;
      }

      // Keep permissions synchronized with the database.
      token.role = currentUser.role;

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as
          | "MEMBER"
          | "EDITOR"
          | "ADMIN"
          | "SUPER_ADMIN";
      }

      return session;
    },
  },
});

