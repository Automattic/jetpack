import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';

export type ShareLimits = {
	limitStatus: 'close' | 'crossed' | 'full' | 'none';
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
		limitExceeded: __(
			'You have exceeded your share limit. Your posts will not longer be shared.',
			'jetpack'
		),
		scheduled: __(
			'You have scheduled posts that will not be shared because you will exceed the share limit.',
			'jetpack'
		),
		approachingLimit: __( 'You are approaching your share limit.', 'jetpack' ),
	};
}

/**
 * Returns the share limits details
 *
 * @returns {ShareLimits} Share limits details
 */
export function useShareLimits(): ShareLimits {
	const limitStatus = useSelect( select => {
		const store = select( socialStore );

		const shareLimit = store.getShareLimit();
		const totalSharesCount = store.getTotalSharesCount( { includeActiveConnections: true } );

		if ( totalSharesCount > shareLimit ) {
			return 'crossed';
		}

		if ( totalSharesCount === shareLimit ) {
			return 'full';
		}

		// If they have used 80% of their limit, they are close
		if ( totalSharesCount >= shareLimit * 0.8 ) {
			return 'close';
		}

		return 'none';
	}, [] );

	const { scheduledShares, usedSharesCount, shareLimit } = useSelect( select => {
		const store = select( socialStore );
		return {
			scheduledShares: store.getScheduledSharesCount(),
			usedSharesCount: store.getSharesUsedCount(),
			shareLimit: store.getShareLimit(),
		};
	}, [] );

	let noticeType: ShareLimits[ 'noticeType' ] = 'default';
	const messages = getMessages( shareLimit );

	let message = messages.default;

	switch ( limitStatus ) {
		case 'crossed':
			noticeType = usedSharesCount >= shareLimit ? 'error' : 'warning';
			message = usedSharesCount >= shareLimit ? messages.limitExceeded : messages.scheduled;
			break;

		case 'full':
			noticeType = scheduledShares > 0 ? 'warning' : 'error';
			message = scheduledShares > 0 ? messages.scheduled : messages.limitExceeded;
			break;

		case 'close':
			noticeType = 'warning';
			message = messages.approachingLimit;
			break;
	}

	return {
		limitStatus,
		message,
		noticeType,
	};
}
