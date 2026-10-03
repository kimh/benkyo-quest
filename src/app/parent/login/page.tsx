import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PixelLink } from "@/components/PixelButton";
import { isValidParentToken, PARENT_COOKIE } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export default async function ParentLoginPage() {
  if (isValidParentToken((await cookies()).get(PARENT_COOKIE)?.value)) redirect("/parent");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 p-4">
      <h1 className="text-2xl text-accent">保護者画面</h1>
      <LoginForm />
      <PixelLink href="/" className="self-start px-3 py-1 text-base">◀ もどる</PixelLink>
    </main>
  );
}
