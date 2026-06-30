/**
 * NodeDetailsAndLinks.tsx
 *
 * Combined panel for the node detail page. Holds the type-specific Details
 * section and the Links section side-by-side on desktop, stacked on mobile.
 * Both inner cards stretch to the same height.
 */

import { useState } from "react";
import type { Node, NodeBlock, NodeType } from "../../types";
import { useCreateLink } from "../../hooks/useNodes";

import { SessionDetails } from "./sections/SessionDetails";
import { CharacterDetails } from "./sections/CharacterDetails";
import { CreatureDetails } from "./sections/CreatureDetails";
import { ItemDetails } from "./sections/ItemDetails";
import { LocationDetails } from "./sections/LocationDetails";
import { FactionDetails } from "./sections/FactionDetails";
import { LinksSection } from "./LinksSection";
import { AddLinkModal } from "./AddLinkModal";

/**
 * Common props passed to every type-specific detail section.
 */
export interface DetailSectionProps {
  node: Node;
  isEditing: boolean;
  onDone: () => void;
}

/**
 * Maps each NodeType to its dedicated detail-section component.
 * NOTE nodes have no extra detail fields, so they render nothing here.
 */
const DETAIL_COMPONENTS: Record<NodeType, React.FC<DetailSectionProps>> = {
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
  /** Whether the current user may edit type-specific details. */
  canEditDetails?: boolean;
}

/**
 * Renders the Details and Links cards in a shared panel.
 *
 * On wide screens the Details card occupies two thirds and the Links card
 * occupies one third. On narrow screens they stack. Both cards use `h-full`
 * so the shorter one stretches to match the taller one.
 */
export function NodeDetailsAndLinks({ node, campaignId, blocks, canEditDetails }: Props) {
  const [showAddLink, setShowAddLink] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const createLink = useCreateLink(node.id, campaignId);

  const DetailComponent = DETAIL_COMPONENTS[node.type];
  const hasDetails = node.type !== "NOTE";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Details card */}
      {hasDetails && DetailComponent && (
        <div className="lg:col-span-2">
          <section className="flex h-full flex-col rounded-xl border border-transparent bg-card-bg p-4  md:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">Details</h2>
              {canEditDetails && !isEditingDetails && (
                <button
                  onClick={() => setIsEditingDetails(true)}
                  className="rounded-md px-2 py-1 text-sm text-muted hover:bg-surface dark:text-secondary dark:hover:bg-surface"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="flex-1">
              <DetailComponent
                node={node}
                isEditing={isEditingDetails}
                onDone={() => setIsEditingDetails(false)}
              />
            </div>
          </section>
        </div>
      )}

      {/* Links card */}
      <div className={hasDetails ? "lg:col-span-1" : "lg:col-span-3"}>
        <section className="flex h-full flex-col rounded-xl border border-transparent bg-card-bg p-4  md:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary">
              Links
            </h2>
            <button
              onClick={() => setShowAddLink(true)}
              className="rounded-lg bg-accent px-2.5 py-1 text-sm font-medium text-text-on-accent hover:bg-accent-hover"
              aria-label="Add link"
            >
              +
            </button>
          </div>
          <div className="flex-1">
            <LinksSection node={node} campaignId={campaignId} blocks={blocks} />
          </div>
        </section>
      </div>

      {showAddLink && (
        <AddLinkModal
          nodeId={node.id}
          campaignId={campaignId}
          onAdd={async (data) => {
            await createLink.mutateAsync(data);
          }}
          onClose={() => setShowAddLink(false)}
          isPending={createLink.isPending}
        />
      )}
    </div>
  );
}
