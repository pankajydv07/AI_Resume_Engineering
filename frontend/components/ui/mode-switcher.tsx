"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type PanelMode = "chat" | "edit";

interface ModeSwitcherProps {
  mode: PanelMode;
  onModeChange: (mode: PanelMode) => void;
  disabled?: boolean;
  className?: string;
}

export function ModeSwitcher({
  mode,
  onModeChange,
  disabled = false,
  className,
}: ModeSwitcherProps) {
  return (
    <div
      className={cn(
        "relative flex items-center p-1 rounded-xl",
        "bg-gray-800/50 backdrop-blur-sm",
        "border border-gray-700/50",
        className
      )}
    >
      {/* Animated background pill */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg"
        initial={false}
        animate={{
          x: mode === "chat" ? 0 : "100%",
          width: "calc(50% - 2px)",
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
      />

      {/* Chat button */}
      <button
        onClick={() => onModeChange("chat")}
        disabled={disabled}
        className={cn(
          "relative z-10 flex items-center justify-center gap-2 flex-1",
          "px-4 py-2 rounded-lg text-sm font-medium",
          "transition-colors duration-200",
          mode === "chat"
            ? "text-white"
            : "text-gray-400 hover:text-gray-200",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <MessageSquare className="w-4 h-4" />
        <span>Chat</span>
      </button>

      {/* Edit button */}
      <button
        onClick={() => onModeChange("edit")}
        disabled={disabled}
        className={cn(
          "relative z-10 flex items-center justify-center gap-2 flex-1",
          "px-4 py-2 rounded-lg text-sm font-medium",
          "transition-colors duration-200",
          mode === "edit"
            ? "text-white"
            : "text-gray-400 hover:text-gray-200",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Pencil className="w-4 h-4" />
        <span>Edit</span>
      </button>
    </div>
  );
}
