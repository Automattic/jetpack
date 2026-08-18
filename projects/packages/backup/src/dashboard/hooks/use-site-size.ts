import { useQuery } from '@tanstack/react-query';
import { fetchSiteSize } from '../data/api/site-size';
import { keys } from '../data/query-client';
import { useCanQueryWpcom } from './use-connection';

const SITE_SIZE_STALE_MS = 5 * 60_000;

type Result = {
	/**
	 * Whether WPCOM has stopped backing this site up, currently because
	 * it is out of storage. Defaults to false whenever the answer is
	 * unknown — an unreadable storage figure must not be allowed to
	 * disable a control that would otherwise work.
	 */
	backupsStopped: boolean;
	isLoading: boolean;
};

/**
 * React Query hook exposing WPCOM's "backups stopped" flag.
 *
 * The legacy dashboard reads the same flag, but only as a side effect of
 * rendering its storage meter — so its "Back up now" button stays
 * enabled until an unrelated component further down the page happens to
 * finish fetching. This owns the request instead.
 *
 * Note this is WPCOM's server-side flag, not the client-side
 * `StorageUsageLevels.Full` derivation the legacy overview computes from
 * size and policies. The two can disagree; the button has always used
 * the server flag.
 *
 * @return The stopped flag and its loading state.
 */
export function useSiteSize(): Result {
	const query = useQuery( {
		queryKey: keys.siteSize(),
		queryFn: fetchSiteSize,
		staleTime: SITE_SIZE_STALE_MS,
		enabled: useCanQueryWpcom(),
	} );

	// `ok` is WPCOM's own success flag inside a 200 response; without it
	// the sibling fields carry no meaning.
	const backupsStopped = Boolean( query.data?.ok && query.data?.backups_stopped );

	return { backupsStopped, isLoading: query.isLoading };
}
