import { redirect } from "next/navigation";

export default async function LegacyShopPage({ params }) {
  const id = String(params?.id ?? "").trim();
  if (!id) {
    redirect("/");
  }

  redirect(`/go/${id}`);
}
