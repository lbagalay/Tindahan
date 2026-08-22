import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { applyBusinessTemplateForBusiness } from "@/lib/apply-business-template.server";
import { businessTemplateIds, readTemplateId, resolveTemplateSubscription } from "@/lib/platform-config";
import { resolveLoginEmail } from "@/lib/demo-account";

const credentialsSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
  templateId: z.enum(businessTemplateIds),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        templateId: { label: "Template", type: "text" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: resolveLoginEmail(parsed.data.email) },
          include: { memberships: { include: { business: { include: { settings: true } } }, take: 1 } },
        });
        if (!user || !user.memberships[0]) return null;
        if (!(await compare(parsed.data.password, user.passwordHash))) return null;

        const membership = user.memberships[0];
        const subscription = resolveTemplateSubscription(membership.business.settings);
        if (subscription.status !== "ACTIVE" || !subscription.templateIds.includes(parsed.data.templateId)) return null;
        if (readTemplateId(membership.business.settings?.templateId) !== parsed.data.templateId) {
          await applyBusinessTemplateForBusiness({ businessId: membership.businessId, userId: user.id, templateId: parsed.data.templateId });
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          businessId: membership.businessId,
          businessName: membership.business.name,
          role: membership.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.businessId = user.businessId;
        token.businessName = user.businessName;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.businessId = token.businessId as string;
      session.user.businessName = token.businessName as string;
      session.user.role = token.role as "OWNER" | "STAFF";
      return session;
    },
  },
});
