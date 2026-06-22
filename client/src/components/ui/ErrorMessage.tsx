/**
 * ErrorMessage.tsx
 *
 * Simple reusable alert component for displaying error messages.
 */

/**
 * Displays a styled error message box.
 *
 * @param message - The error text to show.
 */
export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-danger-subtle p-4 text-danger">
      <p className="font-medium">Error</p>
      <p className="text-sm">{message}</p>
    </div>
  );
}
