import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';

export type ShareLimits = {
	limitStatus: 'close' | 'crossed' | 'full' | 'none';
	noticeType: 'default' | 'highlight' | 'warning' | 'error';
	message: string;
};

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
	let message = sprintf(
		// translators: %1$d is the number of shares allowed in 30 days.
		__( 'Share limit for 30 days: %1$d.', 'jetpack' ),
		shareLimit
	);

	// Extract the strings here to avoid `msgid argument is not a string literal` error
	const limitExceededMessage = __(
		'You have exceeded your share limit. Your posts will not longer be shared.',
		'jetpack'
	);
	const scheduledSharesMessage = __(
		'Your scheduled posts will not get shared after you reach the sharing limit.',
		'jetpack'
	);

	switch ( limitStatus ) {
		case 'crossed':
			noticeType = usedSharesCount >= shareLimit ? 'error' : 'warning';
			message = usedSharesCount >= shareLimit ? limitExceededMessage : scheduledSharesMessage;
			break;

		case 'full':
			noticeType = scheduledShares > 0 ? 'warning' : 'error';
			message = scheduledShares > 0 ? scheduledSharesMessage : limitExceededMessage;
			break;

		case 'close':
			noticeType = 'warning';
			message = __( 'You are approaching your share limit.', 'jetpack' );
			break;
	}

	return {
		limitStatus,
		message,
		noticeType,
	};
}
