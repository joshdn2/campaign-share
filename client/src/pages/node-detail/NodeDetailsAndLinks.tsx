/**
 * NodeDetailsAndLinks.tsx
 *
 * Combined panel for the node detail page. Holds the type-specific Details
 * section and the Links section side-by-side on desktop, stacked on mobile.
 * Both inner cards stretch to the same height.
 */

import type { Node, NodeBlock, NodeType } from "../../types";

import { SessionDetails } from "./sections/SessionDetails";
import { CharacterDetails } from "./sections/CharacterDetails";
import { CreatureDetails } from "./sections/CreatureDetails";
import { ItemDetails } from "./sections/ItemDetails";
import { LocationDetails } from "./sections/LocationDetails";
import { FactionDetails } from "./sections/FactionDetails";
import { LinksSection } from "./LinksSection";

/**
 * Maps each NodeType to its dedicated detail-section component.
 * NOTE nodes have no extra detail fields, so they render nothing here.
 */
const DETAIL_COMPONENTS: Record<NodeType, React.FC<{ node: Node }>> = {
  SESSION: SessionDetails,
  CHARACTER: CharacterDetails,
  CREATURE: CreatureDetails,
  ITEM: ItemDetails,
  LOCATION: LocationDetails,
  NOTE: () => null,
  FACTION: FactionDetails,
};

interface Props {
  node: Node;
  campaignId: string;
  /** Blocks used to derive mention-style links from inline tags. */
  blocks?: NodeBlock[];
}

/**
 * Renders the Details and Links cards in a shared panel.
 *
 * On wide screens the Details card occupies two thirds and the Links card
 * occupies one third. On narrow screens they stack. Both cards use `h-full`
 * so the shorter one stretches to match the taller one.
 */
export function NodeDetailsAndLinks({ node, campaignId, blocks }: Props) {
  const DetailComponent = DETAIL_COMPONENTS[node.type];
  const hasDetails = node.type !== "NOTE";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Details card */}
      {hasDetails && DetailComponent && (
        <div className="lg:col-span-2">
          <section className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 md:p-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white">
              Details
            </h2>
            <div className="flex-1">
              <DetailComponent node={node} />
            </div>
          </section>
        </div>
      )}

      {/* Links card */}
      <div className={hasDetails ? "lg:col-span-1" : "lg:col-span-3"}>
        <section className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 md:p-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white">
            Links
          </h2>
          <div className="flex-1">
            <LinksSection node={node} campaignId={campaignId} blocks={blocks} />
          </div>
        </section>
      </div>
    </div>
  );
}
