"use server";

import { AuthError } from "next-auth";
import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { businessTemplates, resolveTemplateSubscription } from "@/lib/platform-config";
import { resolveLoginEmail } from "@/lib/demo-account";

const accessSchema = z.object({ email: z.string().trim().min(1), password: z.string().min(1) });

export type LoginTemplateAccess = {
  businessName: string;
  plan: string;
  templates: { id: keyof typeof businessTemplates; name: string; description: string }[];
};

export async function getLoginTemplateAccess(input: unknown): Promise<{ ok: true; access: LoginTemplateAccess } | { ok: false; error: string }> {
  const parsed = accessSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter your demo ID or email and password." };

  const user = await prisma.user.findUnique({
    where: { email: resolveLoginEmail(parsed.data.email) },
    include: { memberships: { include: { business: { include: { settings: true } } }, take: 1 } },
  });
  if (!user || !user.memberships[0] || !(await compare(parsed.data.password, user.passwordHash))) {
    return { ok: false, error: "The email or password is incorrect." };
  }

  const membership = user.memberships[0];
  const subscription = resolveTemplateSubscription(membership.business.settings);
  if (subscription.status !== "ACTIVE") return { ok: false, error: "This business subscription is not active. Please contact support." };

  return {
    ok: true,
    access: {
      businessName: membership.business.name,
      plan: subscription.plan,
      templates: subscription.templateIds.map((id) => ({ id, name: businessTemplates[id].name, description: businessTemplates[id].description })),
    },
  };
}

export async function authenticateWithTemplate(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      templateId: formData.get("templateId"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) redirect("/login?error=CredentialsSignin");
    throw error;
  }
}
