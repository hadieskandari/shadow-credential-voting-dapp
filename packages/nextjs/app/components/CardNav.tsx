"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { gsap } from "gsap";
import { GoArrowUpRight } from "react-icons/go";

export type CardNavLink = {
  label: string;
  href?: string;
  ariaLabel?: string;
};

export type CardNavItem = {
  label: string;
  bgColor: string;
  textColor: string;
  links: CardNavLink[];
};

export interface CardNavProps {
  items: CardNavItem[];
  className?: string;
  ease?: string;
  baseColor?: string;
  menuColor?: string;
}

export const CardNav: React.FC<CardNavProps> = ({
  items,
  className = "",
  ease = "power3.out",
  baseColor = "#0b0b0b",
  menuColor = "#fff",
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const cardCount = items.length;

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (!isMobile) return 260;
    const contentEl = navEl.querySelector(".card-nav-content") as HTMLElement | null;
    if (!contentEl) return 260;

    const { visibility, pointerEvents, position, height } = contentEl.style;
    contentEl.style.visibility = "visible";
    contentEl.style.pointerEvents = "auto";
    contentEl.style.position = "static";
    contentEl.style.height = "auto";
    const topBar = 60;
    const padding = 16;
    const contentHeight = contentEl.scrollHeight;
    contentEl.style.visibility = visibility;
    contentEl.style.pointerEvents = pointerEvents;
    contentEl.style.position = position;
    contentEl.style.height = height;
    return topBar + contentHeight + padding;
  };

  const createTimeline = useCallback(() => {
    const navEl = navRef.current;
    if (!navEl) return null;
    const targets = cardsRef.current.slice(0, cardCount);
    gsap.set(navEl, { height: 60, overflow: "hidden" });
    gsap.set(targets, { y: 50, opacity: 0 });
    const tl = gsap.timeline({ paused: true });
    tl.to(navEl, { height: calculateHeight, duration: 0.4, ease });
    tl.to(targets, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, "-=0.1");
    return tl;
  }, [cardCount, ease]);

  useLayoutEffect(() => {
    tlRef.current = createTimeline();
    return () => {
      tlRef.current?.kill();
      tlRef.current = null;
    };
  }, [createTimeline]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;
      if (isExpanded) {
        gsap.set(navRef.current, { height: calculateHeight() });
      } else {
        tlRef.current.kill();
        tlRef.current = createTimeline();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [createTimeline, isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback("onReverseComplete", () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = (index: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[index] = el;
  };

  return (
    <div
      className={`card-nav-container absolute left-1/2 -translate-x-1/2 w-[92%] max-w-[900px] z-[99] top-[1.5rem] md:top-[2rem] ${className}`}
    >
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? "open" : ""} block h-[60px] p-0 rounded-xl shadow-md relative overflow-hidden`}
        style={{ backgroundColor: baseColor }}
      >
        <div className="card-nav-top absolute inset-x-0 top-0 h-[60px] px-4 sm:px-6 z-[2] flex items-center justify-between relative">
          <div className="flex items-center">
            <div
              className={`hamburger-menu ${isHamburgerOpen ? "open" : ""} group flex flex-col gap-[6px] cursor-pointer`}
              onClick={toggleMenu}
              role="button"
              aria-label={isExpanded ? "Close menu" : "Open menu"}
              tabIndex={0}
              style={{ color: menuColor }}
            >
              <div
                className={`hamburger-line w-[30px] h-[2px] bg-current transition-all duration-300 ${isHamburgerOpen ? "translate-y-[4px] rotate-45" : ""}`}
              />
              <div
                className={`hamburger-line w-[30px] h-[2px] bg-current transition-all duration-300 ${isHamburgerOpen ? "-translate-y-[4px] -rotate-45" : ""}`}
              />
            </div>
          </div>
          <div className="logo-container absolute left-1/2 -translate-x-1/2">
            <img src="/shadow-logo.png" alt="Shadow logo" className="h-9 w-9 rounded" />
          </div>
          <div className="flex justify-end items-center ml-auto min-w-[150px]">
            <ConnectButton chainStatus="icon" showBalance={false} />
          </div>
        </div>
        <div
          className={`card-nav-content absolute left-0 right-0 top-[60px] bottom-0 p-2 flex flex-col gap-2 z-[1] ${
            isExpanded ? "visible pointer-events-auto" : "invisible pointer-events-none"
          } md:flex-row md:items-stretch md:gap-3`}
        >
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              ref={setCardRef(idx)}
              className="nav-card relative flex flex-col gap-2 p-3 rounded-xl flex-1 min-h-[180px]"
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="text-lg md:text-xl font-medium tracking-tight">{item.label}</div>
              <div className="flex flex-col gap-1">
                {item.links?.map(link => (
                  <a
                    key={`${item.label}-${link.label}`}
                    className="inline-flex items-center gap-2 text-sm md:text-base hover:opacity-75 transition-opacity"
                    href={link.href ?? "#"}
                    aria-label={link.ariaLabel ?? link.label}
                  >
                    <GoArrowUpRight aria-hidden className="shrink-0" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
