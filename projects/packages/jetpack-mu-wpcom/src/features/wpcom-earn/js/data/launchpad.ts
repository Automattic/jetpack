import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';

export interface LaunchpadTask {
	id: string;
	title: string;
	subtitle?: string;
	completed: boolean;
	disabled: boolean;
	calypso_path?: string;
}

export const EARN_CHECKLIST = 'earn';

/**
 * The earn checklist. The site serves it itself on both platforms, so it skips earnFetch.
 *
 * @return The query.
 */
export function useEarnChecklist() {
	return useQuery( {
		queryKey: [ 'earn', 'launchpad', EARN_CHECKLIST ],
		queryFn: () =>
			apiFetch< { checklist?: LaunchpadTask[] } >( {
				path: `/wpcom/v2/launchpad?checklist_slug=${ EARN_CHECKLIST }&launchpad_context=earn`,
			} ),
		select: data => data.checklist ?? [],
	} );
}
