"use client";

import { ReactNode } from "react";
import { Button } from "@radix-ui/themes";

interface VoteButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled: boolean;
  selected: boolean;
  loading: boolean;
}

export const VoteButton = ({ children, onClick, disabled, selected, loading }: VoteButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      variant={selected ? "solid" : "surface"}
      color={selected ? "green" : "gray"}
      size="3"
      className="w-full"
      data-loading={loading ? "true" : undefined}
    >
      {children}
    </Button>
  );
};

export default VoteButton;
