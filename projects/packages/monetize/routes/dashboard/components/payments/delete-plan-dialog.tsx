import { __, sprintf } from '@wordpress/i18n';
import { AlertDialog, CheckboxControl } from '@wordpress/ui';
import { useCallback, useState } from 'react';
import { DeleteProductsError, useDeleteProducts } from '../../data/memberships';
import { trackPaymentsEvent } from '../../data/tracking';
import type { Plan } from './plans';

/**
 * Confirms deleting a plan, optionally cancelling its subscriptions.
 *
 * @param props         - Component props.
 * @param props.plan    - The plan, with a tier's annual product.
 * @param props.onClose - Called once the dialog should go.
 * @return The dialog.
 */
export default function DeletePlanDialog( { plan, onClose }: { plan: Plan; onClose: () => void } ) {
	const [ cancelSubscriptions, setCancelSubscriptions ] = useState( false );
	const [ remainingIds, setRemainingIds ] = useState( () => [
		plan.product.id,
		...( plan.annual ? [ plan.annual.id ] : [] ),
	] );
	const deleteProducts = useDeleteProducts();

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
			await deleteProducts.mutateAsync( { ids: remainingIds, cancelSubscriptions } );
			trackPaymentsEvent( 'plan_delete', { cancel_subscriptions: cancelSubscriptions } );
		} catch ( error ) {
			if ( error instanceof DeleteProductsError ) {
				setRemainingIds( error.failedIds );
			}
			return {
				close: false,
				error:
					( error as Error ).message ||
					__( 'The plan could not be deleted. Please try again.', 'jetpack-monetize' ),
			};
		}
	}, [ cancelSubscriptions, deleteProducts, remainingIds ] );

	return (
		<AlertDialog.Root open onOpenChange={ onOpenChange } onConfirm={ onConfirm }>
			<AlertDialog.Popup
				intent="irreversible"
				title={ __( 'Delete plan?', 'jetpack-monetize' ) }
				description={ sprintf(
					/* translators: %s: the plan's name. */
					__(
						'Deleting “%s” won’t affect existing subscribers, who will continue to be charged unless you cancel their subscriptions too.',
						'jetpack-monetize'
					),
					plan.product.title
				) }
				confirmButtonText={ __( 'Delete', 'jetpack-monetize' ) }
			>
				<div className="jp-monetize-payments__delete-options">
					<CheckboxControl
						label={ __( 'Cancel existing subscriptions', 'jetpack-monetize' ) }
						checked={ cancelSubscriptions }
						onCheckedChange={ setCancelSubscriptions }
					/>
				</div>
			</AlertDialog.Popup>
		</AlertDialog.Root>
	);
}
