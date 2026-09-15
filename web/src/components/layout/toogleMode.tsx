"use client";

import * as React from "react";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import { CiBrightnessUp , CiDark } from "react-icons/ci";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer"
    >
      {isLight ? (
        <CiBrightnessUp className="text-yellow-500 text-3xl" aria-hidden="true" />
      ) : (
        <CiDark className="text-white text-3xl" aria-hidden="true" />
      )}
    </button>
  );
}
