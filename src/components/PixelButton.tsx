import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

type Variant = "default" | "accent";

/** RPGのコマンド風の見た目。子どもの指でも押しやすい大きさ */
export function pixelButtonClass(variant: Variant = "default", className = "") {
  const color = variant === "accent" ? "border-accent text-accent" : "border-white text-white";
  return `rpg-window block min-h-14 px-5 py-3 text-center text-xl ${color} active:translate-y-0.5 disabled:opacity-40 aria-disabled:opacity-40 ${className}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function PixelButton({ variant, className, ...props }: ButtonProps) {
  return <button {...props} className={pixelButtonClass(variant, className)} />;
}

type LinkProps = ComponentProps<typeof Link> & { variant?: Variant };

export function PixelLink({ variant, className, ...props }: LinkProps) {
  return <Link {...props} className={pixelButtonClass(variant, className)} />;
}
