import { useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';

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
	const remaining = Number.isFinite( remainingCount )
		? sprintf(
				// translators: %d: The number of shares to social media remaining
				_n(
					'You have %d auto-share remaining.',
					'You have %d auto-shares remaining.',
					remainingCount,
					'jetpack'
				),
				remainingCount
		  )
		: '';
	return {
		default: '',
		exceeded: __(
			'You have reached your auto-share limit. Scheduled posts will not be shared until shares become available.',
			'jetpack'
		),
		full: __( 'You have reached your auto-share limit.', 'jetpack' ),
		approaching: remaining,
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
			const remainingCount = store.numberOfSharesRemaining();
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
			// If they have used 90% of their limit, they are almost at the end
			else if ( totalSharesCount >= shareLimit * 0.9 ) {
				status = 'approaching';
				noticeType = 'error';
				message = messages.approaching;
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
