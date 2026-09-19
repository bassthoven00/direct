import { redirect } from "next/navigation";

// Account page removed — redirect to homepage
export default function AccountPage() {
  redirect("/");
}
