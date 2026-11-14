"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

type PressableProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  cursor?: "button" | "upload" | "finding";
};

/** Button with press compression + click ripple ring. */
export function Pressable({
  className,
  cursor = "button",
  children,
  onClick,
  disabled,
  ...props
}: PressableProps) {
  const ref = useRef<HTMLButtonElement>(null);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const button = ref.current;
    if (button && !disabled) {
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "cc-ripple";
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
      button.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 450);
    }
    onClick?.(event);
  }

  return (
    <button
      ref={ref}
      type="button"
      data-cursor={cursor}
      disabled={disabled}
      onClick={handleClick}
      className={cn("cc-pressable relative overflow-hidden", className)}
      {...props}
    >
      {children}
    </button>
  );
}
