import type { Metadata } from "next";
import { Dashboard } from "@/components/Dashboard";

export const metadata: Metadata = {
  title: "Your documents — zenDoc",
  description: "Your private zenDoc document library.",
};

export default function DashboardPage() {
  return <Dashboard />;
}
