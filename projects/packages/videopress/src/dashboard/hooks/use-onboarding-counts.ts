import { useLibrary } from './use-library';
import type { View } from '@wordpress/dataviews';

/*
 * Two 1-row count queries, same idiom as `FIRST_RUN_COUNT_VIEW` in
 * use-first-run-state: `perPage: 1` keeps the payload to a single row and the
 * count comes from the collection's `X-WP-Total` header. The `type` filter is
 * what splits them — `videopress` resolves server-side to "has a VideoPress
 * GUID", `local` to "video attachment with no GUID", so `localCount` is
 * genuinely the number of migration candidates.
 */
const countView = ( type: 'videopress' | 'local' ): View => ( {
	type: 'table',
	page: 1,
	perPage: 1,
	fields: [],
	filters: [ { field: 'type', value: type, operator: 'is' } ],
	search: '',
	sort: { field: 'date', direction: 'desc' },
} );

const VIDEOPRESS_COUNT_VIEW = countView( 'videopress' );
const LOCAL_COUNT_VIEW = countView( 'local' );

export type OnboardingCounts = {
	/** Videos already hosted on VideoPress. */
	videoPressCount: number;
	/** Local video attachments that could be moved to VideoPress. */
	localCount: number;
	/** True once BOTH counts have a real answer. */
	isSettled: boolean;
};

/**
 * The two library counts the welcome modal keys off: whether VideoPress is
 * unused (gates the modal), and how many local videos are waiting to be moved
 * over (picks the secondary button).
 *
 * Counts read 0 while loading; anything acting on them — opening the modal,
 * choosing a button label — must wait for `isSettled`, per the same
 * don't-act-on-an-optimistic-count rule `useSettledFirstRunState` codifies.
 *
 * @return Both counts and whether they have settled.
 */
export function useOnboardingCounts(): OnboardingCounts {
	const videoPress = useLibrary( VIDEOPRESS_COUNT_VIEW );
	const local = useLibrary( LOCAL_COUNT_VIEW );

	return {
		videoPressCount: videoPress.paginationInfo?.totalItems ?? 0,
		localCount: local.paginationInfo?.totalItems ?? 0,
		isSettled: ! videoPress.isLoading && ! local.isLoading,
	};
}
