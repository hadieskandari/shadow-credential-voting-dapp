import React from "react";
import { Toast, ToastPosition, toast } from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/20/solid";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";

type NotificationProps = {
  content: React.ReactNode;
  status: "success" | "info" | "loading" | "error" | "warning";
  duration?: number;
  icon?: string;
  position?: ToastPosition;
};

type NotificationOptions = {
  duration?: number;
  icon?: string;
  position?: ToastPosition;
};

const ENUM_STATUSES = {
  success: <CheckCircleIcon className="h-5 w-5 text-[#ffd208]" />,
  loading: <span className="h-4 w-4 animate-spin rounded-full border border-white/20 border-t-[#ffd208]" />,
  error: <ExclamationCircleIcon className="h-5 w-5 text-rose-300" />,
  info: <InformationCircleIcon className="h-5 w-5 text-slate-200" />,
  warning: <ExclamationTriangleIcon className="h-5 w-5 text-amber-300" />,
} as const;

const DEFAULT_DURATION = 3200;
const DEFAULT_POSITION: ToastPosition = "top-right";

/**
 * Custom Notification
 */
const Notification = ({
  content,
  status,
  duration = DEFAULT_DURATION,
  icon,
  position = DEFAULT_POSITION,
}: NotificationProps) => {
  return toast.custom(
    (t: Toast) => (
      <div
        className={`relative flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-2xl border border-white/12 bg-[#050505]/96 px-4 py-3 text-sm text-white shadow-[0_16px_36px_rgba(255,210,8,0.22)] backdrop-blur-xl transition-all duration-300 ease-out
        ${
          position.substring(0, 3) === "top"
            ? `${t.visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"}`
            : `${t.visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`
        }`}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
          {icon ?? ENUM_STATUSES[status]}
        </div>
        <div className="flex-1 overflow-hidden text-[0.92rem] leading-snug text-gray-100">{content}</div>
        <button
          type="button"
          aria-label="Dismiss notification"
          className="text-gray-400 transition hover:text-white"
          onClick={() => toast.dismiss(t.id)}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        <div className="pointer-events-none absolute inset-px rounded-[20px] border border-white/10 opacity-40 shadow-[0_0_25px_rgba(255,210,8,0.28)]" />
      </div>
    ),
    {
      duration: status === "loading" ? Infinity : duration,
      position,
    },
  );
};

export const notification = {
  success: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "success", ...options });
  },
  info: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "info", ...options });
  },
  warning: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "warning", ...options });
  },
  error: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "error", ...options });
  },
  loading: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "loading", ...options });
  },
  remove: (toastId: string) => {
    toast.remove(toastId);
  },
};
