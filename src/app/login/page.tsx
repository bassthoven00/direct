import { redirect } from "next/navigation";

// Login page removed — redirect to homepage
export default function LoginPage() {
  redirect("/");
}
