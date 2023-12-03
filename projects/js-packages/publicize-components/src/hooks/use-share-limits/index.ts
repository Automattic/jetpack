import { useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { useScheduledPost } from '../use-scheduled-post';

export type ShareLimits = {
	status: 'approaching' | 'exceeded' | 'full' | 'none';
	noticeType: 'default' | 'warning' | 'error';
	message: string;
	usedCount: number;
	scheduledCount: number;
	remainingCount: number;
};

export type UseShareLimitsArgs = {
	scheduledCountAdjustment?: number;
	usedCountAdjustment?: number;
};

/**
 * Returns the messages for the share limits
 *
 * @param {number} remainingCount - The number of shares left
 * @returns {ReturnType<typeof getMessages>} Share limits messages
 */
export function getMessages( remainingCount: number ) {
	return {
		default: '',
		exceeded: __(
			'You have have reached your auto-share. Scheduled posts will not be shared until shares become available.',
			'jetpack'
		),
		full: __( 'You have reached your auto-share limit.', 'jetpack' ),
		approaching: sprintf(
			// translators: %d: The number of shares to social media remaining
			_n(
				'You have %d auto-share remaining',
				'You have %d auto-shares remaining',
				remainingCount,
				'jetpack'
			),
			remainingCount
		),
	};
}

/**
 * Returns the share limits details
 *
 * @param {UseShareLimitsArgs} args - Arguments
 *
 * @returns {ShareLimits} Share limits details
 */
export function useShareLimits( {
	scheduledCountAdjustment = 0,
	usedCountAdjustment = 0,
}: UseShareLimitsArgs = {} ): ShareLimits {
	return useSelect(
		select => {
			const store = select( socialStore );

			const shareLimit = store.getShareLimit();
			const scheduledShares = store.getScheduledSharesCount() + scheduledCountAdjustment;
			const usedSharesCount = store.getSharesUsedCount() + usedCountAdjustment;
			const totalSharesCount = usedSharesCount + scheduledShares;
			const remainingCount = Math.max( 0, shareLimit - usedSharesCount - scheduledShares );
			const messages = getMessages( remainingCount );

			let noticeType: ShareLimits[ 'noticeType' ] = 'default';
			let status: ShareLimits[ 'status' ] = 'none';
			let message = messages.default;

			// If they have exceeded their limit
			if ( totalSharesCount > shareLimit ) {
				noticeType = 'error';
				status = 'exceeded';
				message = messages.exceeded;
			} else if ( totalSharesCount === shareLimit ) {
				status = 'full';
				noticeType = 'error';
				message = messages.full;
			}
			// If they have used 80% of their limit, they are approaching it
			else if ( totalSharesCount >= shareLimit * 0.8 ) {
				status = 'approaching';
				noticeType = 'warning';
				message = messages.approaching;
			}

			return {
				status,
				noticeType,
				message,
				usedCount: usedSharesCount,
				scheduledCount: scheduledShares,
				remainingCount,
			};
		},
		[ scheduledCountAdjustment, usedCountAdjustment ]
	);
}

/**
 * Wraps the useShareLimits hook with the current post context, so we adjust the share
 * counts according to the connections selected on the post.
 *
 * @returns {ShareLimits} Share limits details
 */
export function usePostShareLimits() {
	const { isScheduled, daysUntilPublish, isScheduledWithin30Days } = useScheduledPost();
	const { enabledConnectionsCount, initialConnectionsCount } = useSelect(
		select => {
			const store = select( socialStore );

			const initialConnections = isScheduledWithin30Days
				? store.getInitialEnabledConnectionsCount()
				: 0;
			const enabledConnections = store.getEnabledConnections();

			return {
				enabledConnectionsCount:
					! isScheduled || isScheduledWithin30Days ? enabledConnections.length : 0,
				initialConnectionsCount: initialConnections,
			};
		},
		[ isScheduled, daysUntilPublish, isScheduledWithin30Days ]
	);

	return useShareLimits( {
		scheduledCountAdjustment: isScheduledWithin30Days
			? enabledConnectionsCount - initialConnectionsCount
			: 0,
		usedCountAdjustment: ! isScheduled ? enabledConnectionsCount : 0,
	} );
}
