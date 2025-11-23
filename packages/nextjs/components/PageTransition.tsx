"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  children: React.ReactNode;
};

const PageTransition = ({ children }: Props) => {
  const pathname = usePathname();
  const [activePath, setActivePath] = useState(pathname);

  useEffect(() => {
    setActivePath(pathname);
  }, [pathname]);

  return (
    <div key={activePath} className="page-transition-shell">
      <div className="page-transition-glow" aria-hidden />
      {children}
    </div>
  );
};

export default PageTransition;
