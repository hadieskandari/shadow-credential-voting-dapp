"use client";

import { CardNav, CardNavItem } from "./CardNav";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";

const navItems: CardNavItem[] = [
  {
    label: "Socials",
    bgColor: "#111",
    textColor: "#fff",
    links: [
      { label: "Twitter (X)", href: "https://x.com/zama_fhe" },
      { label: "GitHub", href: "https://github.com/zama-ai" },
      { label: "Telegram", href: "https://t.me/zama_fhe" },
      { label: "Email", href: "mailto:hello@zama.ai" },
    ],
  },
  {
    label: "About",
    bgColor: "#1f1f1f",
    textColor: "#fff",
    links: [
      { label: "Featured", href: "https://www.zama.ai/" },
      { label: "Case Studies", href: "https://www.zama.ai/blog" },
    ],
  },
  {
    label: "Voting DApp",
    bgColor: "#ffd209",
    textColor: "#111",
    links: [
      { label: "Get Faucet", href: "https://faucet.quicknode.com/ethereum/sepolia" },
      { label: "Create Vote", href: "/" },
      { label: "Discover Polls", href: "/discover" },
    ],
  },
];

export const Navbar = () => {
  return (
    <NavigationMenu.Root className="flex items-center justify-center w-full">
      <CardNav items={navItems} />
    </NavigationMenu.Root>
  );
};

export default Navbar;
