/**
 * LoadingSpinner.tsx
 *
 * Centered animated spinner used while asynchronous data is loading.
 */

/**
 * Renders a rotating CSS spinner.
 *
 * @param className - Optional extra Tailwind classes (e.g. for padding/margins).
 */
export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
    </div>
  );
}
