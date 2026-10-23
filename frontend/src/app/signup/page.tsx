import type { Metadata } from "next";
import { AuthPage } from "@/components/AuthPage";

export const metadata: Metadata = {
  title: "Sign up — zenDoc",
  description: "Create your private zenDoc document vault.",
};

export default function SignupPage() {
  return <AuthPage mode="signup" />;
}
