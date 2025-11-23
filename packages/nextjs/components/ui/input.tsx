"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

gsap.registerPlugin(useGSAP);

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => {
  const radius = 110;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const gradientRef = React.useRef<HTMLDivElement | null>(null);
  const mousePosition = React.useRef({ x: 0, y: 0 });

  useGSAP(
    () => {
      if (!gradientRef.current) return;
      gsap.set(gradientRef.current, {
        background: `radial-gradient(0px circle at ${mousePosition.current.x}px ${mousePosition.current.y}px, #ffd208, transparent 75%)`,
      });
    },
    { scope: containerRef },
  );

  function animateTo(x: number, y: number, size: number) {
    if (!gradientRef.current) return;
    gsap.to(gradientRef.current, {
      background: `radial-gradient(${size}px circle at ${x}px ${y}px, #ffd208, transparent 75%)`,
      duration: 0.25,
    });
  }

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    const { left, top } = containerRef.current.getBoundingClientRect();
    const x = event.clientX - left;
    const y = event.clientY - top;
    mousePosition.current = { x, y };
    animateTo(x, y, radius);
  }

  function handleMouseEnter(event: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    const { left, top } = containerRef.current.getBoundingClientRect();
    const x = event.clientX - left;
    const y = event.clientY - top;
    mousePosition.current = { x, y };
    animateTo(x, y, radius);
  }

  function handleMouseLeave() {
    animateTo(mousePosition.current.x, mousePosition.current.y, 0);
  }

  return (
    <div
      ref={containerRef}
      className="group/input relative rounded-2xl p-[3px]"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={gradientRef} className="pointer-events-none absolute inset-0 rounded-2xl opacity-80 transition" />
      <input
        ref={ref}
        type={type}
        className={cn(
          "relative z-10 h-14 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-base text-white placeholder:text-gray-500 outline-none transition focus-visible:border-[#ffd208]/70",
          className,
        )}
        {...props}
      />
    </div>
  );
});

Input.displayName = "Input";
