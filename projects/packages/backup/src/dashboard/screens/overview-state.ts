import type { View } from '@wordpress/dataviews';

/**
 * What the Overview remembers across an unmount, which a trip to Download or Restore and a
 * gate verdict change both cause.
 *
 * Kept out of `overview.tsx` so the Jest setup can reset it without loading the screen.
 */
export const overviewState: {
	/** Whether this page load has recorded its view; `overview.tsx` says why this is not a ref. */
	hasRecordedPageView: boolean;
	/** Where the reader last was in the list, or null for the screen's initial view. */
	lastView: View | null;
	/** The row the reader last chose. */
	lastSelectedId: string | null;
} = {
	hasRecordedPageView: false,
	lastView: null,
	lastSelectedId: null,
};

/**
 * Forget the visit, as a new page load would. Test-only.
 */
export function resetOverviewStateForTesting(): void {
	overviewState.hasRecordedPageView = false;
	overviewState.lastView = null;
	overviewState.lastSelectedId = null;
}
