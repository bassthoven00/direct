import { redirect } from "next/navigation";

// Register page removed — redirect to homepage
export default function RegisterPage() {
  redirect("/");
}
