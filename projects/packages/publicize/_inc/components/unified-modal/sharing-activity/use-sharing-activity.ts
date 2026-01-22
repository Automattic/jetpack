import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useMemo } from '@wordpress/element';
import { store as socialStore } from '../../../social-store';
import { ScheduledActivityItem, SharedActivityItem, SharingActivityItem } from './types';

interface UseSharingActivityReturn {
	/**
	 * Combined and normalized activity items.
	 */
	items: SharingActivityItem[];

	/**
	 * Whether data is loading.
	 */
	isLoading: boolean;

	/**
	 * Whether shared data is polling.
	 */
	isPolling: boolean;

	/**
	 * Count of shared items.
	 */
	sharedCount: number;

	/**
	 * Count of scheduled items.
	 */
	scheduledCount: number;
}

/**
 * Hook to fetch and combine shared and scheduled activity data.
 *
 * @return Combined sharing activity data with loading states
 */
export function useSharingActivity(): UseSharingActivityReturn {
	const postId = useSelect( select => Number( select( editorStore ).getCurrentPostId() ), [] );

	// Fetch shared posts data
	const postShareStatus = useSelect(
		select => select( socialStore ).getPostShareStatus( postId ),
		[ postId ]
	);

	// Fetch scheduled shares data
	const scheduledShares = useSelect(
		select => select( socialStore ).getScheduledSharesForPost( postId ),
		[ postId ]
	);

	const isFetchingScheduled = useSelect(
		select => select( socialStore ).isFetchingScheduledSharesForPost( postId ),
		[ postId ]
	);

	// Get connection lookup function
	const getConnectionById = useSelect( select => select( socialStore ).getConnectionById, [] );

	// Get IDs of scheduled shares being deleted (reactive)
	const deletingIdsArray = useSelect(
		select => {
			const { isDeletingScheduledShare } = select( socialStore );
			return scheduledShares
				.filter( share => isDeletingScheduledShare( share.id ) )
				.map( share => share.id );
		},
		[ scheduledShares ]
	);

	// Create Set outside useSelect to avoid "data changing" warnings
	const deletingIds = useMemo( () => new Set( deletingIdsArray ), [ deletingIdsArray ] );

	// Transform and combine the data
	const { items, sharedCount, scheduledCount } = useMemo( () => {
		const result: SharingActivityItem[] = [];
		let shared = 0;
		let scheduled = 0;

		// Transform shared items
		for ( const share of postShareStatus.shares ) {
			const item: SharedActivityItem = {
				id: `shared-${ share.external_id || share.connection_id }-${ share.timestamp }`,
				activityType: 'shared',
				status: share.status,
				timestamp: share.timestamp,
				serviceName: share.service,
				displayName: share.external_name,
				profilePicture: share.profile_picture,
				profileLink: share.profile_link,
				connectionId: share.connection_id,
				externalId: share.external_id,
				message: share.message,
				originalItem: share,
			};
			result.push( item );
			shared++;
		}

		// Transform scheduled items
		for ( const scheduledShare of scheduledShares ) {
			// Skip items being deleted
			if ( deletingIds.has( scheduledShare.id ) ) {
				continue;
			}

			const connection = getConnectionById( scheduledShare.connection_id.toString() );

			// Skip if connection no longer exists
			if ( ! connection ) {
				continue;
			}

			const item: ScheduledActivityItem = {
				id: `scheduled-${ scheduledShare.id }`,
				activityType: 'scheduled',
				status: 'scheduled',
				timestamp: scheduledShare.timestamp,
				serviceName: connection.service_name,
				displayName: connection.display_name,
				profilePicture: connection.profile_picture,
				profileLink: connection.profile_link,
				scheduleId: scheduledShare.id,
				connectionId: scheduledShare.connection_id,
				connection,
			};
			result.push( item );
			scheduled++;
		}

		// Sort by timestamp descending (most recent first)
		result.sort( ( a, b ) => b.timestamp - a.timestamp );

		return {
			items: result,
			sharedCount: shared,
			scheduledCount: scheduled,
		};
	}, [ postShareStatus.shares, scheduledShares, getConnectionById, deletingIds ] );

	return useMemo(
		() => ( {
			items,
			isLoading: postShareStatus.loading || isFetchingScheduled,
			isPolling: postShareStatus.polling ?? false,
			sharedCount,
			scheduledCount,
		} ),
		[
			items,
			postShareStatus.loading,
			isFetchingScheduled,
			postShareStatus.polling,
			sharedCount,
			scheduledCount,
		]
	);
}
