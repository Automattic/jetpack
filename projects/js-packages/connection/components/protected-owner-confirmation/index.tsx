import { Button, Modal, Notice } from '@wordpress/components';
import { useCallback, useEffect, useState } from 'react';
import { getProtectedOwnerConfirmationCopy } from './copy';
import './style.scss';

export interface ProtectedOwnerConfirmationProps {
	/** Whether the dialog is open. */
	isOpen: boolean;
	/** Called when the dialog closes without a successful claim. */
	onClose: () => void;
	/** Called after WordPress.com accepts the claim. */
	onConfirmed?: () => void;
	/** "site" or "store", already translated. */
	subject?: string;
	/** Plugins that asked for a protected owner, when the caller knows them. */
	requestingPlugins?: string[];
	/** REST root. Falls back to the connection initial state. */
	apiRoot?: string;
	/** REST nonce. Falls back to the connection initial state. */
	apiNonce?: string;
}

/**
 * Ask the current user to become the protected owner.
 *
 * Accept posts to `POST /jetpack/v4/connection/owner/protect`. Cancel leaves the site unchanged.
 *
 * @param {ProtectedOwnerConfirmationProps} props - Component props.
 * @return {import('react').ReactNode} The dialog, or null when closed.
 */
export default function ProtectedOwnerConfirmation( {
	isOpen,
	onClose,
	onConfirmed,
	subject,
	requestingPlugins = [],
	apiRoot,
	apiNonce,
}: ProtectedOwnerConfirmationProps ) {
	const [ isConfirming, setIsConfirming ] = useState( false );
	const [ error, setError ] = useState< { message: string; code?: string } | null >( null );

	useEffect( () => {
		if ( isOpen ) {
			setError( null );
			setIsConfirming( false );
		}
	}, [ isOpen ] );

	const close = useCallback( () => {
		if ( ! isConfirming ) {
			onClose();
		}
	}, [ isConfirming, onClose ] );

	const confirm = useCallback( async () => {
		setIsConfirming( true );
		setError( null );

		const state = window.JP_CONNECTION_INITIAL_STATE;
		const root = apiRoot || state?.apiRoot || '';
		const nonce = apiNonce || state?.apiNonce || '';
		const endpoint = `${ root.replace( /\/?$/, '/' ) }jetpack/v4/connection/owner/protect`;

		let response: Response;
		try {
			response = await fetch( endpoint, {
				method: 'POST',
				headers: {
					'X-WP-Nonce': nonce,
				},
			} );
		} catch {
			setError( {
				message: getProtectedOwnerConfirmationCopy().confirmError,
			} );
			setIsConfirming( false );
			return;
		}

		const body = await response.json().catch( () => null );

		if ( ! response.ok ) {
			setError( {
				message: body?.message || getProtectedOwnerConfirmationCopy().confirmError,
				code: body?.code,
			} );
			setIsConfirming( false );
			return;
		}

		onConfirmed?.();
		onClose();
	}, [ apiNonce, apiRoot, onClose, onConfirmed ] );

	if ( ! isOpen ) {
		return null;
	}

	const copy = getProtectedOwnerConfirmationCopy( { subject, requestingPlugins } );

	return (
		<Modal
			title={ copy.title }
			onRequestClose={ close }
			className="jp-protected-owner-confirmation"
		>
			<p>{ copy.body }</p>
			{ copy.requestedBy && <p>{ copy.requestedBy }</p> }
			{ error && (
				<Notice status="error" isDismissible={ false }>
					{ error.message }
				</Notice>
			) }
			{ error?.code === 'protected_owner_claimed_by_other' && (
				<p>
					<a href={ copy.supportUrl }>{ copy.contactSupport }</a>
				</p>
			) }
			<div className="jp-protected-owner-confirmation__actions">
				<Button variant="tertiary" onClick={ close } disabled={ isConfirming }>
					{ copy.cancel }
				</Button>
				<Button
					variant="primary"
					onClick={ confirm }
					isBusy={ isConfirming }
					disabled={ isConfirming }
				>
					{ copy.confirm }
				</Button>
			</div>
		</Modal>
	);
}
