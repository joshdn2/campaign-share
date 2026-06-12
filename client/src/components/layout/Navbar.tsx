/**
 * Navbar.tsx
 *
 * Persistent top navigation bar. Shows a hamburger menu on small screens,
 * a back button when viewing a specific campaign, the app brand, and the
 * authenticated user's display name with a logout action.
 */

import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

interface NavbarProps {
  /** Called when the mobile hamburger menu is pressed. */
  onMenuClick?: () => void;
}

/**
 * Renders the application header.
 *
 * Reads the current user from the Zustand auth store and the active
 * campaign id from React Router's URL parameters. When a campaign id is
 * present, an additional "Back" button returns the user to the campaigns
 * list. On mobile a hamburger button opens the sidebar navigation overlay.
 */
export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { campaignId } = useParams();

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger: only visible on small screens and only when a
            menu click handler has been provided by the layout shell. */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 md:hidden dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Open navigation menu"
            title="Open menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        )}

        {/* Back button appears only when inside a campaign route */}
        {campaignId && (
          <button
            onClick={() => navigate("/campaigns")}
            className="hidden rounded-md p-1.5 text-gray-600 hover:bg-gray-100 sm:block dark:text-gray-300 dark:hover:bg-gray-800"
            title="Back to campaigns"
          >
            ← Back
          </button>
        )}

        {/* App title navigates back to the campaigns list */}
        <h1
          className="cursor-pointer text-lg font-bold text-gray-800 dark:text-white"
          onClick={() => navigate("/campaigns")}
        >
          CampaignHub
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Show user info and logout only while authenticated */}
        {user && (
          <>
            <span className="hidden text-sm text-gray-600 sm:inline dark:text-gray-300">
              {user.displayName}
            </span>
            <button
              onClick={() => {
                // Clear the session in the auth store, then redirect.
                logout();
                navigate("/login");
              }}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
