/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import {
	useConstrainedTabbing,
	useFocusOnMount,
	useFocusReturn,
	useInstanceId,
	useMergeRefs,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
/**
 * Types
 */
import type { KeyboardEvent, ReactElement } from 'react';

type ConfirmationOverlayProps = {
	message: string;
	confirmLabel: string;
	onConfirm: () => void;
	onCancel: () => void;
};

/**
 * In-modal confirmation dialog, rendered as an overlay inside the caption
 * manager rather than as a nested Modal: WordPress modals dismiss or hide
 * other modals when one opens on top, which reads as the caption manager
 * closing and reopening.
 *
 * @param props              - Component props.
 * @param props.message      - Confirmation question to show.
 * @param props.confirmLabel - Label for the (destructive) confirm button.
 * @param props.onConfirm    - Called when the user confirms.
 * @param props.onCancel     - Called when the user cancels or presses Escape.
 * @return The confirmation overlay.
 */
export default function ConfirmationOverlay( {
	message,
	confirmLabel,
	onConfirm,
	onCancel,
}: ConfirmationOverlayProps ): ReactElement {
	const messageId = useInstanceId( ConfirmationOverlay, 'videopress-caption-manager-confirm' );
	const dialogRef = useMergeRefs( [
		useConstrainedTabbing(),
		useFocusOnMount( 'firstElement' ),
		useFocusReturn(),
	] );

	const handleKeyDown = ( event: KeyboardEvent< HTMLDivElement > ) => {
		if ( event.key === 'Escape' ) {
			// Stop the event so the host modal's own Escape handling doesn't also run.
			event.preventDefault();
			event.stopPropagation();
			onCancel();
		}
	};

	return (
		<div className="videopress-caption-manager__confirm-scrim">
			{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Escape-to-cancel for the dialog. */ }
			<div
				className="videopress-caption-manager__confirm-dialog"
				role="alertdialog"
				aria-modal="true"
				aria-labelledby={ messageId }
				onKeyDown={ handleKeyDown }
				ref={ dialogRef }
			>
				<p id={ messageId }>{ message }</p>
				<div className="videopress-caption-manager__confirm-actions">
					<Button variant="tertiary" onClick={ onCancel }>
						{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
					</Button>
					<Button variant="primary" isDestructive onClick={ onConfirm }>
						{ confirmLabel }
					</Button>
				</div>
			</div>
		</div>
	);
}
