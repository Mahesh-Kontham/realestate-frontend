import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { BellIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import Link from "next/link";


export default function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const handleLogout = async () => {
  await supabase.auth.signOut();
  alert("You have logged out");
  router.push("/");
};

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
          <Link href="/dashboard">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer hover:underline">
      Dashboard
    </h1>

          </Link>
          {/* <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            <input placeholder="Search..." className="bg-transparent outline-none text-sm dark:text-gray-200" />
          </div> */}
        </div>

        <div className="flex items-center space-x-2">
          {/* <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button> */}

          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="px-1 py-2 rounded-md bg-gray-200 dark:bg-gray-700 dark:text-white"
          >
            {isDark ? "🌞 Light" : "🌙 Dark"}
          </button>
            <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700"
        >
          Logout
        </button>
        </div>
        
      </div>
    </header>
  );
}
