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

	// Get connections for all activity items (reactive)
	const connectionsArray = useSelect(
		select => {
			const { getConnectionById } = select( socialStore );

			// Collect unique connection IDs from both shared and scheduled items
			const connectionIds = new Set< string >();
			for ( const share of postShareStatus.shares ) {
				connectionIds.add( share.connection_id.toString() );
			}
			for ( const share of scheduledShares ) {
				connectionIds.add( share.connection_id.toString() );
			}

			return Array.from( connectionIds )
				.map( connectionId => ( {
					connectionId,
					connection: getConnectionById( connectionId ),
				} ) )
				.filter( item => item.connection );
		},
		[ postShareStatus.shares, scheduledShares ]
	);

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

	// Create lookup structures outside useSelect to avoid "data changing" warnings
	const connectionsMap = useMemo(
		() => new Map( connectionsArray.map( item => [ item.connectionId, item.connection ] ) ),
		[ connectionsArray ]
	);
	const deletingIds = useMemo( () => new Set( deletingIdsArray ), [ deletingIdsArray ] );

	// Transform and combine the data
	const { items, sharedCount, scheduledCount } = useMemo( () => {
		const result: SharingActivityItem[] = [];
		let shared = 0;
		let scheduled = 0;

		// Transform shared items
		for ( const share of postShareStatus.shares ) {
			const connection = connectionsMap.get( share.connection_id.toString() );

			const item: SharedActivityItem = {
				id: `shared-${ share.external_id || share.connection_id }-${ share.timestamp }`,
				activityType: 'shared',
				status: share.status,
				timestamp: share.timestamp,
				// Use connection as source of truth, fall back to share data
				serviceName: connection?.service_name ?? share.service,
				displayName: connection?.display_name ?? share.external_name,
				profilePicture: connection?.profile_picture ?? share.profile_picture,
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

			const connection = connectionsMap.get( scheduledShare.connection_id.toString() );

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
				scheduleId: scheduledShare.id,
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
	}, [ postShareStatus.shares, scheduledShares, connectionsMap, deletingIds ] );

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
