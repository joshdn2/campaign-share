/**
 * Layout.tsx
 *
 * Top-level authenticated application shell. Provides a persistent
 * header (Navbar), collapsible navigation (Sidebar), and a scrollable
 * main content area that renders the matched route via Outlet.
 *
 * Responsive behavior:
 *  - On desktop the sidebar is always visible as a fixed-width panel.
 *  - On mobile the sidebar is hidden by default and slides in as an overlay
 *    when the user opens it from the navbar hamburger menu.
 *  - The main content area uses responsive padding so it uses the available
 *    width without wasting space on large screens.
 */

import { useState } from "react";
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
  // Controls the mobile slide-over sidebar. On desktop the sidebar ignores
  // this state and is always rendered.
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-base dark:bg-base">
      {/* Top navigation bar; the hamburger button toggles the mobile sidebar. */}
      <Navbar onMenuClick={() => setMobileSidebarOpen(true)} />

      {/* Sidebar + main content area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        {/* Scrollable region for the current route. Padding shrinks on small
            screens so content uses the full width. */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
