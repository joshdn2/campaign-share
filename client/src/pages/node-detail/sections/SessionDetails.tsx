import type { Node } from "../../../types";

// Displays session-specific fields: number, date, summaries.
export function SessionDetails({ node }: { node: Node }) {
  if (!node.sessionDetail) return null;

  return (
    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
      <p>
        <span className="font-medium">Session Number:</span> {node.sessionDetail.sessionNumber}
      </p>
      {node.sessionDetail.sessionDate && (
        <p>
          <span className="font-medium">Date:</span>{" "}
          {new Date(node.sessionDetail.sessionDate).toLocaleDateString()}
        </p>
      )}
      {node.sessionDetail.shortSummary && (
        <p>
          <span className="font-medium">Short Summary:</span> {node.sessionDetail.shortSummary}
        </p>
      )}
      {node.sessionDetail.longSummary && (
        <p>
          <span className="font-medium">Long Summary:</span> {node.sessionDetail.longSummary}
        </p>
      )}
    </div>
  );
}
