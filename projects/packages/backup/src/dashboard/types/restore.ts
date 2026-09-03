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
 *
 * `checking` is the opening state of every cold load: the screen does not
 * yet know whether this site already has a restore running, and must show
 * neither the form nor a progress bar until it does. It is short — one
 * request, usually — but it cannot be skipped, because the alternative is
 * an armed Confirm button that is withdrawn a moment later.
 *
 * `unconfirmed` is the submission whose answer never arrived. It is not
 * `error`, because nothing has been ruled out: WordPress.com may have
 * queued the restore and lost only the reply. It is not `queued` either,
 * because that copy promises a restore is under way. The screen says what
 * is true — we are finding out — and offers no control until it knows.
 *
 * `lost-track` is separate from `error` for the same reason, and it
 * matters more. The two say opposite things about the live site: `error`
 * means nothing is running, `lost-track` means something probably is and
 * we can no longer see it — either the silence deadline passed or the
 * status poll stopped answering. Folding them together is not a wording
 * problem. The screen offers "Try again" on `error`, which resets to an
 * armed Confirm button, so a reader following the only control on screen
 * would start a *second concurrent restore* of the same site, directly
 * beneath a notice telling them the first may still be running. Nothing
 * upstream is known to refuse that.
 *
 * The rule the split encodes: a retry is offered only when we know
 * nothing is running.
 *
 * `detail` carries a transport failure's own text when there is one,
 * shown beneath the shared message rather than replacing it — why we
 * stopped seeing the restore is worth reporting, but it is not the
 * headline.
 */
export type RestoreState =
	| { phase: 'checking' }
	| { phase: 'idle' }
	| { phase: 'submitting' }
	| { phase: 'queued' }
	| { phase: 'unconfirmed'; detail: string | null }
	| { phase: 'progress'; percent: number; message: string }
	| { phase: 'success' }
	| { phase: 'success-with-errors'; message: string }
	| { phase: 'lost-track'; detail: string | null }
	| { phase: 'error'; message: string };
