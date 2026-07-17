import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { AlertDialog } from '@wordpress/ui';
import { useRemoveCompMutation } from '../../data/use-comp-mutation';
import { getSubscriberLabel } from '../../lib/subscriber-helpers';
import { recordTracksEvent } from '../../lib/tracks';
import type { Subscriber } from '../../data/types';

type Props = {
	pending: { subscriber: Subscriber; compId: number; planTitle?: string } | null;
	onClose: () => void;
};

/**
 * Confirmation dialog for the per-row Remove-comp action. Mirrors Calypso's `<RemoveCompModal>`,
 * which is a plain confirm — there's no plan picker because the comp_id alone identifies the
 * complimentary subscription to revoke.
 *
 * @param props         - Component props.
 * @param props.pending - Comp queued for removal (null hides the dialog).
 * @param props.onClose - Close handler.
 * @return Dialog or null when nothing is queued.
 */
export default function RemoveCompModal( { pending, onClose }: Props ): JSX.Element | null {
	const mutation = useRemoveCompMutation();

	const handleConfirm = useCallback( async () => {
		if ( ! pending ) {
			return;
		}
		recordTracksEvent( 'jetpack_subscribers_remove_comp_confirm', {
			comp_id: pending.compId,
		} );
		await mutation.mutateAsync( {
			compId: pending.compId,
			planTitle: pending.planTitle,
			subscriberName: getSubscriberLabel( pending.subscriber ),
		} );
	}, [ mutation, pending ] );

	const handleOpenChange = useCallback(
		( nextOpen: boolean ) => {
			if ( ! nextOpen ) {
				onClose();
			}
		},
		[ onClose ]
	);

	if ( ! pending ) {
		return null;
	}

	const subscriberName = getSubscriberLabel( pending.subscriber );
	const title = pending.planTitle
		? sprintf(
				// translators: %1$s: subscriber name. %2$s: plan title.
				__( 'Remove %1$s from %2$s?', 'jetpack-newsletter' ),
				subscriberName,
				pending.planTitle
		  )
		: sprintf(
				// translators: %s: subscriber name.
				__( 'Remove the complimentary subscription for %s?', 'jetpack-newsletter' ),
				subscriberName
		  );

	const description = __(
		'They’ll lose access to the paid content this comp grants. They’ll keep their free subscription.',
		'jetpack-newsletter'
	);

	return (
		<AlertDialog.Root open onOpenChange={ handleOpenChange } onConfirm={ handleConfirm }>
			<AlertDialog.Popup
				intent="irreversible"
				title={ title }
				description={ description }
				confirmButtonText={ __( 'Remove comp', 'jetpack-newsletter' ) }
				cancelButtonText={ __( 'Cancel', 'jetpack-newsletter' ) }
			/>
		</AlertDialog.Root>
	);
}
