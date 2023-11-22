import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';

export type ShareLimits = {
	status: 'approaching' | 'exceeded' | 'full' | 'none';
	noticeType: 'default' | 'highlight' | 'warning' | 'error';
	message: string;
};

/**
 * Returns the messages for the share limits
 *
 * @param {number} shareLimit - Share limit
 *
 * @returns {ReturnType<typeof getMessages>} Share limits messages
 */
export function getMessages( shareLimit: number ) {
	return {
		default: sprintf(
			// translators: %1$d is the number of shares allowed in 30 days.
			__( 'Share limit for 30 days: %1$d.', 'jetpack' ),
			shareLimit
		),
		exceeded: __(
			'You have exceeded your share limit. Your posts will no longer be shared.',
			'jetpack'
		),
		scheduled: __(
			'You have scheduled posts that will not be shared because you will exceed the share limit.',
			'jetpack'
		),
		approaching: __( 'You are approaching your share limit.', 'jetpack' ),
	};
}

/**
 * Returns the share limits details
 *
 * @returns {ShareLimits} Share limits details
 */
export function useShareLimits(): ShareLimits {
	return useSelect( select => {
		const store = select( socialStore );

		const shareLimit = store.getShareLimit();
		const totalSharesCount = store.getTotalSharesCount( { includeActiveConnections: true } );
		const scheduledShares = store.getScheduledSharesCount();
		const usedSharesCount = store.getSharesUsedCount();
		const messages = getMessages( shareLimit );

		let noticeType: ShareLimits[ 'noticeType' ] = 'default';
		let status: ShareLimits[ 'status' ] = 'none';
		let message = messages.default;

		// If they have exceeded their limit
		if ( totalSharesCount > shareLimit ) {
			status = 'exceeded';
			message = messages.exceeded;

			/**
			 * Here we have these cases:
			 * 1. used >= limit: they have exceeded their limit without scheduled shares or active connections
			 * 2. used < limit: they have exceeded their limit with scheduled shares or active connections
			 * 2a. scheduled > 0: it means they have scheduled shares
			 * 2b. scheduled = 0: it means they have active connections
			 */
			// Case 1
			if ( usedSharesCount >= shareLimit ) {
				noticeType = 'error';
			}
			// Case 2a
			else if ( scheduledShares > 0 ) {
				noticeType = 'warning';
				message = messages.scheduled;
			}
			// Case 2b
			else {
				noticeType = 'warning';
				// May be we should use a different message here?
			}
		} else if ( totalSharesCount === shareLimit ) {
			status = 'full';
			noticeType = 'warning';
			/**
			 * Here we have these cases:
			 * 1. used = limit & scheduled = 0 & active = 0: they have reached their limit without scheduled shares or active connections
			 * 2. scheduled > 0: it means they have scheduled shares
			 * 3. scheduled = 0: it means they have active connections
			 *
			 */
			// Case 1
			if ( usedSharesCount === shareLimit ) {
				noticeType = 'error';
				message = messages.exceeded;
			}
			// Case 2
			else if ( scheduledShares > 0 ) {
				message = messages.scheduled;
			}
			// Case 3
			else {
				noticeType = 'error';
				// May be we should use a different message here?
			}
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
		};
	}, [] );
}
