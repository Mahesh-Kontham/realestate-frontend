import Link from "next/link";
import { HomeIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// NavItem Component
const NavItem = ({ href, icon: Icon, label }) => (
  <Link
    href={href}
    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 
               hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium"
  >
    <Icon className="w-5 h-5" />
    {label}
  </Link>
);

export default function Sidebar() {
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const email = data.user.email;
        setUserEmail(email);

        const extractedName = email.split("@")[0];
        setUserName(
          extractedName.charAt(0).toUpperCase() + extractedName.slice(1)
        );

        setRole(email === "admin@realestate.com" ? "Admin" : "Owner");
      }
    };

    getUser();
  }, []);

  return (
    <div
      className="
        p-4 flex flex-col justify-between h-full 
        bg-white dark:bg-gray-900 
        text-gray-900 dark:text-gray-100 
        border-r border-gray-200 dark:border-gray-700
      "
    >
      {/* ==== HEADER ==== */}
      <div>
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-bold">
            RH
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              RealEstate
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {role}
            </p>
          </div>
        </div>

        {/* ==== NAVIGATION ==== */}
        <nav className="flex flex-col gap-2">
          <NavItem href="/dashboard" icon={HomeIcon} label="Dashboard" />
        </nav>
      </div>

      {/* ==== FOOTER ==== */}
      <div className="text-sm text-gray-500 dark:text-gray-400 px-2">
        {userName}
        <br />
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {userEmail}
        </span>
      </div>
    </div>
  );
}
