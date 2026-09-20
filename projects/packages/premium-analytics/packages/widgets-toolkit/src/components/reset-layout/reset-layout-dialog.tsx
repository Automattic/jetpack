/**
 * External dependencies
 */
import { AlertDialog } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';

type ResetLayoutDialogProps = {
	onConfirm: () => void | Promise< void >;
	onClose: () => void;
};

/**
 * Confirms resetting the layout on show to its default, the way the dashboard's
 * own overflow did. What a reset means, and what follows it, is the caller's.
 *
 * @param {ResetLayoutDialogProps} props           - Component props.
 * @param {Function}               props.onConfirm - Called once the reader confirms.
 * @param {Function}               props.onClose   - Called once the dialog closes, confirmed or not.
 * @return The dialog.
 */
export function ResetLayoutDialog( { onConfirm, onClose }: ResetLayoutDialogProps ) {
	const handleOpenChange = useCallback(
		( isOpen: boolean ) => {
			if ( ! isOpen ) {
				onClose();
			}
		},
		[ onClose ]
	);

	return (
		<AlertDialog.Root open onOpenChange={ handleOpenChange } onConfirm={ onConfirm }>
			<AlertDialog.Popup
				intent="irreversible"
				title={ __( 'Reset the layout to default?', 'jetpack-premium-analytics-pkg' ) }
				description={ __(
					'Your changes to this layout will be lost.',
					'jetpack-premium-analytics-pkg'
				) }
				confirmButtonText={ __( 'Reset', 'jetpack-premium-analytics-pkg' ) }
			/>
		</AlertDialog.Root>
	);
}
