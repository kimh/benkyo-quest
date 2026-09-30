import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "accent";
};

/** RPGのコマンド風ボタン。子どもの指でも押しやすい大きさ */
export function PixelButton({ variant = "default", className = "", ...props }: Props) {
  const color =
    variant === "accent"
      ? "border-accent text-accent"
      : "border-white text-white";
  return (
    <button
      {...props}
      className={`rpg-window min-h-14 px-5 py-3 text-xl ${color} active:translate-y-0.5 disabled:opacity-40 ${className}`}
    />
  );
}
