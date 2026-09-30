import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FAMILY_COOKIE, isValidFamilyToken } from "@/lib/session";
import { UnlockForm } from "./UnlockForm";

export default async function UnlockPage() {
  if (isValidFamilyToken((await cookies()).get(FAMILY_COOKIE)?.value)) redirect("/");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl text-accent">勉強クエスト</h1>
      <UnlockForm />
    </main>
  );
}
