/**
 * TaggedText.tsx
 *
 * Renders TEXT block content with clickable node tags. Tags use the syntax
 * @[Node Title](node-id) and are displayed as blue underlined links that
 * navigate to the tagged node's detail page.
 */

import { Link } from "react-router-dom";
import { renderTaggedText } from "../../lib/tags";

interface TaggedTextProps {
  /** Raw block text, which may contain @[Title](node-id) tags. */
  text: string;
  /** Campaign id used to build tagged node URLs. */
  campaignId: string;
}

/**
 * Renders block text, turning any inline node tags into clickable links.
 */
export function TaggedText({ text, campaignId }: TaggedTextProps) {
  const parts = renderTaggedText(text, (nodeId, title, key) => (
    <Link
      key={key}
      to={`/campaigns/${campaignId}/nodes/${nodeId}`}
      className="text-accent underline hover:text-accent dark:text-accent dark:hover:text-accent"
    >
      {title}
    </Link>
  ));

  return <span className="whitespace-pre-wrap">{parts}</span>;
}
