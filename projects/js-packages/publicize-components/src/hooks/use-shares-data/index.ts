import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { getSocialScriptData } from '../../utils/script-data';

/**
 * Hook that provides access to share data and related utility functions.
 *
 * @return {object} Object containing share data and utility functions
 */
export default function useSharesData() {
	const [ apiData, setApiData ] = useState( null );

	useEffect( () => {
		// Skip API calls on WordPress.com platform sites
		if ( isWpcomPlatformSite() ) {
			return;
		}

		const fetchData = async () => {
			try {
				const response = await apiFetch( { path: '/wpcom/v2/jetpack-social' } );
				setApiData( response );
			} catch {
				setApiData( null );
			}
		};

		fetchData();
	}, [] );

	const getSharesData = useCallback( () => {
		return apiData || getSocialScriptData().shares_data;
	}, [ apiData ] );

	return useMemo(
		() => ( {
			/**
			 * Returns the total number of shares already used.
			 *
			 * @return {number} Total number of shares used
			 */
			getSharesUsedCount: () => getSharesData().publicized_count ?? 0,

			/**
			 * Returns the number of shares scheduled.
			 *
			 * @return {number} Number of shares scheduled
			 */
			getScheduledSharesCount: () => getSharesData().to_be_publicized_count ?? 0,

			/**
			 * Returns the total number of shares used and scheduled.
			 *
			 * @return {number} Total number of shares used and scheduled
			 */
			getTotalSharesCount: () => {
				const count =
					( getSharesData().publicized_count ?? 0 ) +
					( getSharesData().to_be_publicized_count ?? 0 );
				return Math.max( count, 0 );
			},

			/**
			 * Number of posts shared this month
			 *
			 * @return {number} Number of posts shared this month
			 */
			getSharedPostsCount: () => getSharesData().shared_posts_count ?? 0,

			/**
			 * Get whether the sharing limits are enabled.
			 *
			 * @return {boolean} Whether the sharing limits are enabled
			 */
			isShareLimitEnabled: () => getSharesData().is_share_limit_enabled ?? false,
		} ),
		[ getSharesData ]
	);
}
