/**
 * External dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import SharedHelpFooter from '../shared/help-footer';
import TransferConnectionOwnership from '../transfer-connection-ownership';
import './style.scss';

interface TransferOwnershipDialogProps {
	/** Whether the dialog is open. */
	isOpen?: boolean;
	/** Callback for when the dialog is closed. */
	onClose: () => void;
	/** API root URL. */
	apiRoot: string;
	/** API nonce. */
	apiNonce: string;
	/** Called when the user leaves after a completed transfer. */
	onTransferred?: ( newOwnerId: number ) => void;
}

/**
 * The ownership transfer step, opened from the manage connection dialog.
 *
 * Do not hoist the body: mounting only while open is what keeps the candidate request
 * off every render of the dialog that hosts it.
 *
 * @param {TransferOwnershipDialogProps} props - Component props.
 * @return {import('react').ReactNode} The TransferOwnershipDialog component.
 */
const TransferOwnershipDialog = ( {
	isOpen,
	onClose,
	apiRoot,
	apiNonce,
	onTransferred,
}: TransferOwnershipDialogProps ) => {
	const title = __( 'Transfer connection ownership', 'jetpack-connection-js' );
	const [ newOwnerId, setNewOwnerId ] = useState< number | null >( null );
	const [ isDismissed, setIsDismissed ] = useState( false );

	// Not `onClose`: the dialog behind still offers owner-only actions to someone who
	// has just stopped being the owner.
	const handleDismiss = useCallback( () => {
		if ( newOwnerId ) {
			// Unmount first: the refresh is a page load, and the modal would otherwise sit
			// there re-rendering until it lands.
			setIsDismissed( true );
			onTransferred?.( newOwnerId );
			return;
		}

		onClose();
	}, [ newOwnerId, onTransferred, onClose ] );

	return (
		isOpen &&
		! isDismissed && (
			<Modal
				title=""
				contentLabel={ title }
				aria={ {
					labelledby: 'jp-connection__transfer-dialog__heading',
				} }
				onRequestClose={ handleDismiss }
				className="jp-connection__disconnect-dialog jp-connection__transfer-dialog"
			>
				<div className="jp-connection__disconnect-dialog__content">
					<h1 id="jp-connection__transfer-dialog__heading">{ title }</h1>
					<TransferConnectionOwnership
						apiRoot={ apiRoot }
						apiNonce={ apiNonce }
						onTransferred={ setNewOwnerId }
						onDismiss={ handleDismiss }
					/>
				</div>
				<div className="jp-connection__transfer-dialog__footer">
					<SharedHelpFooter namespace="jp-connection__disconnect-dialog" />
				</div>
			</Modal>
		)
	);
};

export default TransferOwnershipDialog;
