import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { campaignId } = useParams();

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        {campaignId && (
          <button
            onClick={() => navigate("/campaigns")}
            className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            title="Back to campaigns"
          >
            ← Back
          </button>
        )}
        <h1
          className="cursor-pointer text-lg font-bold text-gray-800 dark:text-white"
          onClick={() => navigate("/campaigns")}
        >
          CampaignHub
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {user.displayName}
            </span>
            <button
              onClick={() => {
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
