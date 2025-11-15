// components/Layout.js
import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* sidebar (hidden on small screens) */}
      <aside className="hidden md:block w-72 bg-sidebar text-white flex-shrink-0">
        <Sidebar />
      </aside>

      {/* main content */}
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
