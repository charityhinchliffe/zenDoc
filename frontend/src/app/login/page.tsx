import type { Metadata } from "next";
import { AuthPage } from "@/components/AuthPage";

export const metadata: Metadata = {
  title: "Log in — zenDoc",
  description: "Log in to your private zenDoc document library.",
};

export default function LoginPage() {
  return <AuthPage mode="login" />;
}
