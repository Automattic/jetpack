import { useCallback, useEffect } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { AlertDialog } from '@wordpress/ui';
import { getSubscriberLabel } from '../../lib/subscriber-helpers';
import { recordTracksEvent } from '../../lib/tracks';
import type { Subscriber } from '../../data/types';

type Props = {
	subscribers: Subscriber[];
	onConfirm: () => void | Promise< void >;
	onCancel: () => void;
};

/**
 * Confirmation dialog for the per-row + bulk remove action. Mirrors Calypso's `UnsubscribeModal`
 * copy: explains the cascade (paid subscription cancel + email + WPCOM follower removal) so the
 * user knows what they're agreeing to. Uses `AlertDialog` from `@wordpress/ui` (`intent="irreversible"`)
 * so the confirm button picks up the destructive coloring and pending state automatically.
 *
 * @param props             - Component props.
 * @param props.subscribers - Subscribers queued for removal (empty list closes the dialog).
 * @param props.onConfirm   - Confirm callback. May return a promise; the dialog will show its
 *                          built-in pending state until it settles.
 * @param props.onCancel    - Cancel callback.
 * @return The dialog, or null when the queue is empty.
 */
export default function UnsubscribeModal( {
	subscribers,
	onConfirm,
	onCancel,
}: Props ): JSX.Element | null {
	const isOpen = subscribers.length > 0;

	// Mirrors Calypso's free vs. paid `_modal_showed` / `_modal_dismissed` events. We classify
	// "paid" as soon as any subscriber in the queue has at least one non-comp paid plan.
	const hasPaidSubscriber = subscribers.some( subscriber =>
		( subscriber.plans ?? [] ).some( plan => ! plan.is_comp )
	);

	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}
		recordTracksEvent(
			hasPaidSubscriber
				? 'jetpack_subscribers_remove_paid_subscriber_modal_showed'
				: 'jetpack_subscribers_remove_free_subscriber_modal_showed'
		);
	}, [ isOpen, hasPaidSubscriber ] );

	const handleOpenChange = useCallback(
		( nextOpen: boolean ) => {
			if ( ! nextOpen ) {
				recordTracksEvent(
					hasPaidSubscriber
						? 'jetpack_subscribers_remove_paid_subscriber_modal_dismissed'
						: 'jetpack_subscribers_remove_free_subscriber_modal_dismissed'
				);
				onCancel();
			}
		},
		[ onCancel, hasPaidSubscriber ]
	);

	if ( subscribers.length === 0 ) {
		return null;
	}

	const isSingle = subscribers.length === 1;
	const title = isSingle
		? sprintf(
				// translators: %s: subscriber display name or email.
				__( 'Remove %s?', 'jetpack-newsletter' ),
				getSubscriberLabel( subscribers[ 0 ] )
		  )
		: sprintf(
				// translators: %d: number of subscribers.
				_n(
					'Remove %d subscriber?',
					'Remove %d subscribers?',
					subscribers.length,
					'jetpack-newsletter'
				),
				subscribers.length
		  );

	const description = __(
		"They'll be unsubscribed from your site, and any paid subscriptions will be cancelled. This can't be undone.",
		'jetpack-newsletter'
	);

	return (
		<AlertDialog.Root open onOpenChange={ handleOpenChange } onConfirm={ onConfirm }>
			<AlertDialog.Popup
				intent="irreversible"
				title={ title }
				description={ description }
				confirmButtonText={ __( 'Remove', 'jetpack-newsletter' ) }
				cancelButtonText={ __( 'Cancel', 'jetpack-newsletter' ) }
			/>
		</AlertDialog.Root>
	);
}
