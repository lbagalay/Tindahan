import "next-auth";

declare module "next-auth" {
  interface User {
    businessId: string;
    businessName: string;
    role: "OWNER" | "STAFF";
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      businessId: string;
      businessName: string;
      role: "OWNER" | "STAFF";
    };
  }
}
