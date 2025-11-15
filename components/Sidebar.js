import Link from "next/link";
import {
  HomeIcon,
  BuildingOffice2Icon,
  UsersIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";

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
  return (
    <div className="p-4 flex flex-col justify-between h-full">
      
      <div>
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-bold">
            RH
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              RealEstate
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Admin</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem href="/dashboard" icon={HomeIcon} label="Dashboard" />
          {/* <NavItem href="/flats" icon={BuildingOffice2Icon} label="Flats" />
          <NavItem href="/tenants" icon={UsersIcon} label="Tenants" />
          <NavItem href="/documents" icon={DocumentIcon} label="Documents" /> */}
        </nav>
      </div>

      <div className="text-sm text-gray-400 px-2">
        Admin User
        <br />
        <span className="text-xs">admin@realestate.com</span>
      </div>
    </div>
  );
}
