/**
 * MergeNodeModal.tsx
 *
 * Allows a DM or Loremaster to merge another public node of the same type into
 * the current node. The user picks which version of each field to keep, then
 * the secondary node is deleted and all of its blocks, tags, links, and
 * children are absorbed by the primary node.
 */

import { useEffect, useMemo, useState } from "react";
import { useCampaignNodes, useMergeNode, useNode } from "../../hooks/useNodes";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import type { Node } from "../../types";

interface Props {
  primaryNode: Node;
  campaignId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type ChoiceValue = "primary" | "secondary";

interface MergeChoices {
  title: ChoiceValue;
  excerpt: ChoiceValue;
  details: Record<string, ChoiceValue>;
}

export function MergeNodeModal({ primaryNode, campaignId, onClose, onSuccess }: Props) {
  const { data: campaignNodes, isLoading: isLoadingCandidates } =
    useCampaignNodes(campaignId);
  const merge = useMergeNode(primaryNode.id);

  const [query, setQuery] = useState("");
  const [secondaryId, setSecondaryId] = useState<string | null>(null);
  const [choices, setChoices] = useState<MergeChoices>({
    title: "primary",
    excerpt: "primary",
    details: {},
  });
  const [step, setStep] = useState<"select" | "compare">("select");

  const candidates = useMemo(() => {
    return (campaignNodes ?? []).filter(
      (n) =>
        n.id !== primaryNode.id &&
        n.type === primaryNode.type &&
        n.visibility === "PUBLIC",
    );
  }, [campaignNodes, primaryNode]);

  const filteredCandidates = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return candidates;
    return candidates.filter((n) => n.title.toLowerCase().includes(term));
  }, [candidates, query]);

  const { data: secondaryNode, isLoading: isLoadingSecondary } = useNode(
    secondaryId ?? "",
  );

  // Initialize per-field choices whenever the selected secondary node changes.
  useEffect(() => {
    if (!secondaryNode) {
      setChoices({ title: "primary", excerpt: "primary", details: {} });
      return;
    }

    const primaryDetail = getDetailFields(primaryNode);
    const secondaryDetail = getDetailFields(secondaryNode);
    const fields = new Set([
      ...Object.keys(primaryDetail),
      ...Object.keys(secondaryDetail),
    ]);

    const details: Record<string, ChoiceValue> = {};
    for (const field of fields) {
      const primaryValue = primaryDetail[field];
      details[field] =
        primaryValue != null && primaryValue !== "" ? "primary" : "secondary";
    }

    setChoices({
      title: primaryNode.title ? "primary" : "secondary",
      excerpt: primaryNode.excerpt ? "primary" : "secondary",
      details,
    });
  }, [primaryNode, secondaryNode]);

  const primaryDetail = useMemo(
    () => getDetailFields(primaryNode),
    [primaryNode],
  );
  const secondaryDetail = useMemo(
    () => (secondaryNode ? getDetailFields(secondaryNode) : {}),
    [secondaryNode],
  );
  const detailFields = useMemo(
    () =>
      Array.from(
        new Set([...Object.keys(primaryDetail), ...Object.keys(secondaryDetail)]),
      ),
    [primaryDetail, secondaryDetail],
  );

  const handleMerge = async () => {
    if (!secondaryNode) return;
    try {
      await merge.mutateAsync({
        secondaryId: secondaryNode.id,
        choices,
      });
      onSuccess();
      onClose();
    } catch {
      // Error is surfaced via merge.error below.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-elevated shadow-xl dark:bg-surface">
        <div className="border-b border-default px-6 py-4">
          <h2 className="text-lg font-bold text-primary">
            Merge with another {primaryNode.type.toLowerCase()}
          </h2>
          <p className="text-sm text-muted">
            Choose a public node of the same type. The current node survives;
            the other node will be deleted.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === "select" ? (
            <div className="space-y-4">
              {isLoadingCandidates ? (
                <LoadingSpinner className="py-8" />
              ) : candidates.length === 0 ? (
                <ErrorMessage message="No public nodes of this type are available to merge." />
              ) : (
                <>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search nodes..."
                    className="w-full rounded-lg border border-default px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-default dark:bg-inset dark:text-primary"
                  />

                  <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                    {filteredCandidates.map((node) => (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSecondaryId(node.id)}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          secondaryId === node.id
                            ? "border-accent bg-accent-subtle ring-1 ring-accent"
                            : "border-default bg-card-bg hover:bg-surface"
                        }`}
                      >
                        <p className="font-medium text-primary">{node.title}</p>
                        <p className="text-xs text-muted">
                          {node.owner.username}
                        </p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {isLoadingSecondary || !secondaryNode ? (
                <LoadingSpinner className="py-8" />
              ) : (
                <>
                  <FieldChooser
                    label="Title"
                    fieldKey="title"
                    primaryValue={primaryNode.title}
                    secondaryValue={secondaryNode.title}
                    chosen={choices.title}
                    onChoose={(value) =>
                      setChoices((c) => ({ ...c, title: value }))
                    }
                  />

                  <FieldChooser
                    label="Excerpt"
                    fieldKey="excerpt"
                    primaryValue={primaryNode.excerpt || "(none)"}
                    secondaryValue={secondaryNode.excerpt || "(none)"}
                    chosen={choices.excerpt}
                    onChoose={(value) =>
                      setChoices((c) => ({ ...c, excerpt: value }))
                    }
                  />

                  {detailFields.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-secondary">
                        Details
                      </h3>
                      {detailFields.map((field) => (
                        <FieldChooser
                          key={field}
                          label={field}
                          fieldKey={field}
                          primaryValue={formatValue(primaryDetail[field])}
                          secondaryValue={formatValue(secondaryDetail[field])}
                          chosen={choices.details[field] ?? "primary"}
                          onChoose={(value) =>
                            setChoices((c) => ({
                              ...c,
                              details: { ...c.details, [field]: value },
                            }))
                          }
                        />
                      ))}
                    </div>
                  )}

                  <div className="rounded-lg border border-default bg-card-bg p-4">
                    <h3 className="mb-2 text-sm font-semibold text-secondary">
                      Blocks
                    </h3>
                    <p className="text-sm text-muted">
                      All blocks from both nodes will be kept and ordered by
                      creation date.
                    </p>
                  </div>

                  <div className="rounded-lg border border-default bg-card-bg p-4">
                    <h3 className="mb-2 text-sm font-semibold text-secondary">
                      Tags
                    </h3>
                    <p className="text-sm text-muted">
                      Tags will be combined and deduplicated.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Array.from(
                        new Set([
                          ...primaryNode.tags.map((t) => t.tag),
                          ...(secondaryNode?.tags ?? []).map((t) => t.tag),
                        ]),
                      ).map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-accent-subtle px-2 py-0.5 text-xs text-accent"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {merge.error && (
          <div className="border-t border-default px-6 py-3">
            <ErrorMessage
              message={getMergeErrorMessage(merge.error)}
            />
          </div>
        )}

        <div className="flex items-center justify-between border-t border-default px-6 py-4">
          {step === "compare" && (
            <button
              type="button"
              onClick={() => setStep("select")}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:bg-surface"
            >
              Back
            </button>
          )}
          {step === "select" && <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:bg-surface"
            >
              Cancel
            </button>

            {step === "select" ? (
              <button
                type="button"
                disabled={!secondaryId}
                onClick={() => setStep("compare")}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-text-on-accent hover:bg-accent-hover disabled:opacity-50"
              >
                Compare
              </button>
            ) : (
              <button
                type="button"
                disabled={merge.isPending || !secondaryNode}
                onClick={handleMerge}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-text-on-accent hover:bg-accent-hover disabled:opacity-50"
              >
                {merge.isPending ? "Merging..." : "Merge"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FieldChooserProps {
  label: string;
  fieldKey: string;
  primaryValue: React.ReactNode;
  secondaryValue: React.ReactNode;
  chosen: ChoiceValue;
  onChoose: (value: ChoiceValue) => void;
}

function FieldChooser({
  label,
  primaryValue,
  secondaryValue,
  chosen,
  onChoose,
}: FieldChooserProps) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border border-default bg-card-bg p-4 md:grid-cols-[1fr_auto_1fr]">
      <button
        type="button"
        onClick={() => onChoose("primary")}
        className={`rounded-md p-3 text-left ${
          chosen === "primary"
            ? "bg-accent-subtle ring-1 ring-accent"
            : "bg-surface hover:bg-elevated"
        }`}
      >
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-secondary">
          Keep current
        </span>
        <span className="block text-sm text-primary">{primaryValue}</span>
      </button>

      <div className="flex items-center justify-center text-xs font-medium text-muted">
        {label}
      </div>

      <button
        type="button"
        onClick={() => onChoose("secondary")}
        className={`rounded-md p-3 text-left ${
          chosen === "secondary"
            ? "bg-accent-subtle ring-1 ring-accent"
            : "bg-surface hover:bg-elevated"
        }`}
      >
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-secondary">
          Merge in
        </span>
        <span className="block text-sm text-primary">{secondaryValue}</span>
      </button>
    </div>
  );
}

function getDetailFields(node: Node): Record<string, unknown> {
  const key = `${node.type.toLowerCase()}Detail` as keyof Node;
  const detail = node[key] as Record<string, unknown> | null | undefined;
  if (!detail) return {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, nodeId, ...fields } = detail;
  return fields;
}

function formatValue(value: unknown): string {
  if (value == null) return "(none)";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function getMergeErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: { error?: unknown } } }).response
      ?.data;
    if (data?.error) {
      if (typeof data.error === "string") return data.error;
      return JSON.stringify(data.error);
    }
  }
  if (error instanceof Error) return error.message;
  return "Merge failed. Please try again.";
}
