/**
 * Layout.tsx
 *
 * Top-level authenticated application shell. Provides a persistent
 * header (Navbar), collapsible navigation (Sidebar), and a scrollable
 * main content area that renders the matched route via Outlet.
 */

import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

/**
 * Renders the fixed application layout.
 *
 * The outer container fills the viewport height (`h-screen`) and uses a
 * vertical flex column. The inner flex row consumes remaining height and
 * hides overflow so the sidebar and main content scroll independently.
 */
export function Layout() {
  return (
    <div className="flex h-screen flex-col bg-white dark:bg-gray-950">
      {/* Top navigation bar */}
      <Navbar />

      {/* Sidebar + main content area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Scrollable region for the current route */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
