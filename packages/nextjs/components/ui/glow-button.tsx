"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

gsap.registerPlugin(useGSAP);

export interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  glowColor?: string;
  fullWidth?: boolean;
}

export const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, glowColor = "#ffd208", fullWidth = true, children, ...props }, ref) => {
    const radius = 110;
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const gradientRef = React.useRef<HTMLDivElement | null>(null);
    const mousePosition = React.useRef({ x: 0, y: 0 });

    useGSAP(
      () => {
        if (!gradientRef.current) return;
        gsap.set(gradientRef.current, {
          background: `radial-gradient(0px circle at ${mousePosition.current.x}px ${mousePosition.current.y}px, ${glowColor}, transparent 80%)`,
        });
      },
      { scope: containerRef },
    );

    function animateTo(x: number, y: number, size: number) {
      if (!gradientRef.current) return;
      gsap.to(gradientRef.current, {
        background: `radial-gradient(${size}px circle at ${x}px ${y}px, ${glowColor}, transparent 80%)`,
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
        className="group/glow relative rounded-2xl p-[3px]"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div ref={gradientRef} className="pointer-events-none absolute inset-0 rounded-2xl opacity-90 transition" />
        <button
          ref={ref}
          className={cn(
            "relative z-10 rounded-2xl border border-white/15 bg-black/70 px-6 py-4 text-base font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
            fullWidth ? "w-full" : "w-auto",
            className,
          )}
          {...props}
        >
          {children}
        </button>
      </div>
    );
  },
);

GlowButton.displayName = "GlowButton";
