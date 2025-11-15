import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { BellIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // avoid SSR flash / mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // render placeholder so SSR matches
    return (
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-semibold">Dashboard</div>
        </div>
      </header>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-xl font-semibold dark:text-white">Dashboard</div>
          {/* <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            <input placeholder="Search..." className="bg-transparent outline-none text-sm dark:text-gray-200" />
          </div> */}
        </div>

        <div className="flex items-center gap-4">
          {/* <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button> */}

          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 dark:text-white"
          >
            {isDark ? "🌞 Light" : "🌙 Dark"}
          </button>
        </div>
      </div>
    </header>
  );
}
