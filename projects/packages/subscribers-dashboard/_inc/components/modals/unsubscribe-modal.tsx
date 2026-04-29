// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { getSubscriberLabel } from '../../lib/subscriber-helpers';
import type { Subscriber } from '../../data/types';

type Props = {
	subscribers: Subscriber[];
	isBusy: boolean;
	onConfirm: () => void;
	onCancel: () => void;
};

/**
 * Confirmation dialog for the per-row + bulk remove action. Mirrors Calypso's `UnsubscribeModal`
 * copy: explains the cascade (paid subscription cancel + email + WPCOM follower removal) so the
 * user knows what they're agreeing to.
 *
 * @param props             - Component props.
 * @param props.subscribers - Subscribers queued for removal.
 * @param props.isBusy      - Whether the mutation is in flight.
 * @param props.onConfirm   - Confirm callback.
 * @param props.onCancel    - Cancel callback.
 * @return The dialog, or null when the queue is empty.
 */
export default function UnsubscribeModal( {
	subscribers,
	isBusy,
	onConfirm,
	onCancel,
}: Props ): JSX.Element | null {
	if ( subscribers.length === 0 ) {
		return null;
	}

	const isSingle = subscribers.length === 1;
	const title = isSingle
		? sprintf(
				// translators: %s: subscriber display name or email.
				__( 'Remove %s?', 'jetpack-subscribers-dashboard' ),
				getSubscriberLabel( subscribers[ 0 ] )
		  )
		: sprintf(
				// translators: %d: number of subscribers.
				_n(
					'Remove %d subscriber?',
					'Remove %d subscribers?',
					subscribers.length,
					'jetpack-subscribers-dashboard'
				),
				subscribers.length
		  );

	return (
		<ConfirmDialog
			isOpen
			confirmButtonText={ __( 'Remove', 'jetpack-subscribers-dashboard' ) }
			cancelButtonText={ __( 'Cancel', 'jetpack-subscribers-dashboard' ) }
			onConfirm={ onConfirm }
			onCancel={ onCancel }
			isBusy={ isBusy }
		>
			<h2 style={ { marginTop: 0 } }>{ title }</h2>
			<p>
				{ isSingle
					? __(
							"They'll be unsubscribed from your site, and any paid subscriptions will be cancelled. This can't be undone.",
							'jetpack-subscribers-dashboard'
					  )
					: __(
							"They'll be unsubscribed from your site, and any paid subscriptions will be cancelled. This can't be undone.",
							'jetpack-subscribers-dashboard'
					  ) }
			</p>
		</ConfirmDialog>
	);
}
