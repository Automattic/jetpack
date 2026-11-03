import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { AlertDialog } from '@wordpress/ui';
import type { JSX } from 'react';

/**
 * Confirm a removal that cannot be undone: deleting a custom service, or the last button on a block theme.
 *
 * @param props             - Props.
 * @param props.kind        - Deleting a custom service, or removing the last button.
 * @param props.serviceName - Service name.
 * @param props.handsOver   - Whether the removal hands the section over to the block.
 * @param props.onConfirm   - Runs the removal.
 * @param props.onCancel    - Closes without removing.
 * @return Dialog.
 */
export function ConfirmRemovalDialog( {
	kind,
	serviceName,
	handsOver,
	onConfirm,
	onCancel,
}: {
	kind: 'last' | 'delete';
	serviceName: string;
	handsOver: boolean;
	onConfirm: () => Promise< void >;
	onCancel: () => void;
} ): JSX.Element {
	const handleOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				onCancel();
			}
		},
		[ onCancel ]
	);

	return (
		<AlertDialog.Root open onOpenChange={ handleOpenChange } onConfirm={ onConfirm }>
			<AlertDialog.Popup
				intent="irreversible"
				title={
					kind === 'delete'
						? sprintf(
								/* translators: %s: custom sharing service name. */
								__( 'Delete %s?', 'jetpack-sharing-likes' ),
								serviceName
							)
						: __( 'Remove your last sharing button?', 'jetpack-sharing-likes' )
				}
				description={
					handsOver
						? __(
								'With no buttons left, sharing buttons turn off. Since you use a block-based theme, you can add the buttons anywhere on your site via the Site Editor.',
								'jetpack-sharing-likes'
							)
						: __(
								'This deletes the custom service from your site. You’ll need to create it again to bring it back.',
								'jetpack-sharing-likes'
							)
				}
				confirmButtonText={
					kind === 'delete'
						? __( 'Delete', 'jetpack-sharing-likes' )
						: __( 'Remove', 'jetpack-sharing-likes' )
				}
			/>
		</AlertDialog.Root>
	);
}
