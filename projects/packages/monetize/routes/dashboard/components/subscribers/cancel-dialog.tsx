import { __, sprintf } from '@wordpress/i18n';
import { AlertDialog } from '@wordpress/ui';
import { useCallback } from 'react';
import { showSuccessSnackbar } from '../../data/notices';
import { useCancelSubscription } from '../../data/subscribers';
import { trackSubscribersEvent } from '../../data/tracking';
import { isOneTime } from './subscriptions';
import type { PaidSubscription } from '../../data/subscribers';

/**
 * Confirms cancelling a subscription, or removing a one-time payment.
 *
 * @param props              - Component props.
 * @param props.subscription - The subscription.
 * @param props.onClose      - Called once the dialog should go.
 * @param props.onCancelled  - Called once the subscription is cancelled.
 * @return The dialog.
 */
export default function CancelDialog( {
	subscription,
	onClose,
	onCancelled,
}: {
	subscription: PaidSubscription;
	onClose: () => void;
	onCancelled?: () => void;
} ) {
	const cancelSubscription = useCancelSubscription();
	const oneTime = isOneTime( subscription );

	const onOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				onClose();
			}
		},
		[ onClose ]
	);

	const onConfirm = useCallback( async () => {
		try {
			await cancelSubscription.mutateAsync( subscription );
			trackSubscribersEvent( 'cancel', { one_time: oneTime } );
			showSuccessSnackbar(
				oneTime
					? __( 'Payment removed.', 'jetpack-monetize' )
					: __( 'Payment cancelled.', 'jetpack-monetize' )
			);
			onCancelled?.();
		} catch ( error ) {
			return {
				close: false,
				error:
					( error as Error ).message ||
					( oneTime
						? __( 'The payment could not be removed. Please try again.', 'jetpack-monetize' )
						: __( 'The payment could not be cancelled. Please try again.', 'jetpack-monetize' ) ),
			};
		}
	}, [ cancelSubscription, subscription, oneTime, onCancelled ] );

	const who =
		subscription.email || subscription.name || __( 'This subscriber', 'jetpack-monetize' );
	const description = oneTime
		? sprintf(
				/* translators: %1$s: the subscriber's email address, or their name when there is none. %2$s: the plan's name. */
				__(
					'%1$s will no longer have access to anything the “%2$s” plan grants. The payment will not be refunded.',
					'jetpack-monetize'
				),
				who,
				subscription.planTitle
			)
		: sprintf(
				/* translators: %1$s: the subscriber's email address, or their name when there is none. %2$s: the plan's name. */
				__(
					'%1$s will no longer have access to anything the “%2$s” plan grants. Payments already made will not be refunded, and no future payments will be taken.',
					'jetpack-monetize'
				),
				who,
				subscription.planTitle
			);

	return (
		<AlertDialog.Root open onOpenChange={ onOpenChange } onConfirm={ onConfirm }>
			<AlertDialog.Popup
				intent="irreversible"
				title={
					oneTime
						? __( 'Remove this payment?', 'jetpack-monetize' )
						: __( 'Cancel this payment?', 'jetpack-monetize' )
				}
				description={ description }
				confirmButtonText={
					oneTime
						? __( 'Remove payment', 'jetpack-monetize' )
						: __( 'Cancel payment', 'jetpack-monetize' )
				}
			/>
		</AlertDialog.Root>
	);
}
