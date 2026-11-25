import { __, sprintf } from '@wordpress/i18n';
import { AlertDialog } from '@wordpress/ui';
import { useCallback } from 'react';
import { useDeleteCoupon } from '../../data/coupons';
import { showSuccessSnackbar } from '../../data/notices';
import { trackPaymentsEvent } from '../../data/tracking';
import type { Coupon } from '../../data/coupons';

/**
 * Confirms deleting a coupon.
 *
 * @param props         - Component props.
 * @param props.coupon  - The coupon.
 * @param props.onClose - Called once the dialog should go.
 * @return The dialog.
 */
export default function DeleteCouponDialog( {
	coupon,
	onClose,
}: {
	coupon: Coupon;
	onClose: () => void;
} ) {
	const deleteCoupon = useDeleteCoupon();

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
			await deleteCoupon.mutateAsync( coupon.id );
			trackPaymentsEvent( 'coupon_delete' );
			showSuccessSnackbar(
				/* translators: %s: a coupon code. */
				sprintf( __( 'Coupon “%s” deleted.', 'jetpack-monetize' ), coupon.code )
			);
		} catch ( error ) {
			return {
				close: false,
				error:
					( error as Error ).message ||
					__( 'The coupon could not be deleted. Please try again.', 'jetpack-monetize' ),
			};
		}
	}, [ coupon.id, coupon.code, deleteCoupon ] );

	return (
		<AlertDialog.Root open onOpenChange={ onOpenChange } onConfirm={ onConfirm }>
			<AlertDialog.Popup
				intent="irreversible"
				title={ __( 'Delete coupon?', 'jetpack-monetize' ) }
				description={ sprintf(
					/* translators: %s: the coupon code. */
					__(
						'Once “%s” is deleted, customers can no longer use it at checkout.',
						'jetpack-monetize'
					),
					coupon.code
				) }
				confirmButtonText={ __( 'Delete', 'jetpack-monetize' ) }
			/>
		</AlertDialog.Root>
	);
}
