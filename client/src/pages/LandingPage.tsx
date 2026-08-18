import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * ============================================================================
 * LandingPage.tsx
 * ============================================================================
 *
 * Public landing page shown at `/` to visitors who are not logged in.
 *
 * Behavior:
 *  - While the session is being restored, renders a full-screen spinner
 *    (same as ProtectedRoute).
 *  - Authenticated users are redirected to /campaigns.
 *  - Everyone else sees the marketing page with links to /register and /login.
 *
 * Layout is mobile-first: single-column stacked sections that expand into
 * multi-column grids on larger screens.
 */

/** Feature highlights shown in the grid, derived from the app's core capabilities. */
const features = [
  {
    title: "Campaigns & invites",
    description:
      "Create a campaign and invite your players so everyone shares the same source of truth.",
  },
  {
    title: "Wiki-style world graph",
    description:
      "Build a connected web of locations, NPCs, factions, items, and any custom node types you need.",
  },
  {
    title: "Rich notes with @mentions",
    description:
      "Write rich text blocks and link between nodes with @ mentions, so lore is always one tap away.",
  },
  {
    title: "In-game calendar",
    description:
      "Track time in your world with custom ages, months, and leap-year rules.",
  },
  {
    title: "Player-safe visibility",
    description:
      "Control what each player sees: public nodes, private notes, or DM-only secrets.",
  },
  {
    title: "Fast search",
    description:
      "Find any node across your campaign in seconds, right when the table needs it.",
  },
];

/**
 * LandingPage – renders the public marketing page for logged-out visitors,
 * or redirects authenticated users to their campaigns.
 */
export function LandingPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-subtle border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/campaigns" replace />;
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-base">
      {/* Header */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          {/* Logo art is white-on-transparent; inverted in light mode */}
          <img
            src="/brand/campaign-notes-logo.png"
            alt="Campaign Notes logo"
            className="h-8 w-auto invert dark:invert-0"
          />
          <span className="text-lg font-bold text-primary">Campaign Notes</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-accent-subtle"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-text-on-accent hover:bg-accent-hover"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pt-12 pb-16 text-center sm:px-6 sm:pt-20 sm:pb-24">
        <h1 className="mx-auto max-w-2xl text-3xl font-bold leading-tight text-primary sm:text-5xl">
          One place for your whole campaign
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted dark:text-secondary sm:text-lg">
          Campaign Notes helps tabletop RPG groups share notes, maps, calendars,
          and lore — so everyone at the table stays on the same page.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="w-full rounded-lg bg-accent px-6 py-3 text-sm font-medium text-text-on-accent hover:bg-accent-hover sm:w-auto"
          >
            Get started
          </Link>
          <Link
            to="/login"
            className="w-full rounded-lg border border-default px-6 py-3 text-sm font-medium text-primary hover:bg-accent-subtle sm:w-auto"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 sm:pb-24">
        <h2 className="text-center text-xl font-bold text-primary sm:text-2xl">
          Everything your table needs
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl bg-card-bg p-6 shadow-lg"
            >
              <h3 className="text-accent font-semibold text-primary">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted dark:text-secondary">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom call to action */}
      <section className="mx-auto max-w-5xl px-4 pb-16 text-center sm:px-6 sm:pb-24">
        <h2 className="text-xl font-bold text-primary sm:text-2xl">
          Ready to run your campaign?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted dark:text-secondary">
          Create an account and start building your world in minutes.
        </p>
        <Link
          to="/register"
          className="mt-6 inline-block rounded-lg bg-accent px-6 py-3 text-sm font-medium text-text-on-accent hover:bg-accent-hover"
        >
          Get started
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-default">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
          <div className="flex items-center gap-2">
            <img
              src="/brand/campaign-notes-logo.png"
              alt="Campaign Notes logo"
              className="h-6 w-auto invert dark:invert-0"
            />
            <span className="text-sm text-muted dark:text-secondary">
              Campaign Notes
            </span>
          </div>
          <Link
            to="/login"
            className="text-sm font-medium text-accent hover:underline"
          >
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
