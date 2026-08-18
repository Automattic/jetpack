export type RestoreItems = {
	themes: boolean;
	plugins: boolean;
	roots: boolean;
	contents: boolean;
	sqls: boolean;
	uploads: boolean;
};

export const DEFAULT_RESTORE_ITEMS: RestoreItems = {
	themes: true,
	plugins: true,
	roots: true,
	contents: true,
	sqls: true,
	uploads: true,
};

/**
 * Whether the checklist names at least one category.
 *
 * Both screens gate their submit button on this, and they have to: an
 * empty checklist does not ask WPCOM for nothing. The request omits
 * `types` entirely, and an absent `types` is upstream's shorthand for all
 * six categories — so an unticked list submits a full download, or a full
 * destructive restore, which is the opposite of what it shows.
 *
 * The request layer refuses the same state independently; see
 * `requireTypes` in `data/api/_helpers`. This one exists so the reader is
 * told before they click rather than after.
 *
 * @param items - The category checklist.
 * @return True when at least one category is selected.
 */
export function hasSelectedItems( items: RestoreItems ): boolean {
	return Object.values( items ).some( Boolean );
}

/**
 * What the Restore screen is showing.
 *
 * `queued` is separate from `progress` because they are different
 * promises to the reader: one says the restore is under way and here is
 * how far, the other says WordPress.com has accepted it and has not
 * started reporting yet. Collapsing them means rendering a progress bar
 * pinned at 0% for the opening seconds of every restore, which reads as
 * a stall.
 *
 * `success-with-errors` is its own terminal state rather than a shade of
 * either neighbour. A restore that finished but not cleanly should not
 * be dismissed as done, and should not be retried as if nothing landed.
 */
export type RestoreState =
	| { phase: 'idle' }
	| { phase: 'submitting' }
	| { phase: 'queued' }
	| { phase: 'progress'; percent: number }
	| { phase: 'success' }
	| { phase: 'success-with-errors'; message: string }
	| { phase: 'error'; message: string };
