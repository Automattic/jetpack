import { getScriptData } from '@automattic/jetpack-script-data';
import { Button, Modal, Notice } from '@wordpress/components';
import { useCallback, useEffect, useState } from 'react';
import { getProtectedOwnerConfirmationCopy } from './copy';
import type { ProtectedOwnerConfirmError, ProtectedOwnerConfirmationProps } from './types';
import './style.scss';

/** REST error code for a site a different WordPress.com account already protects. */
export const PROTECTED_OWNER_CLAIMED_BY_OTHER = 'protected_owner_claimed_by_other';

/**
 * Read the refusal the server sent, falling back to the generic wording.
 *
 * The body is server JSON, so each field is checked rather than asserted.
 *
 * @param {unknown} raw - Parsed response body, or null when it did not parse.
 * @return {ProtectedOwnerConfirmError} Message to show, and the code when there is a usable one.
 */
function toConfirmError( raw: unknown ): ProtectedOwnerConfirmError {
	const body = !! raw && typeof raw === 'object' ? raw : {};
	const message = 'message' in body && typeof body.message === 'string' ? body.message : '';
	const code = 'code' in body && typeof body.code === 'string' ? body.code : undefined;

	return {
		message: message || getProtectedOwnerConfirmationCopy().confirmError,
		code,
	};
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
	apiRoot,
	apiNonce,
}: ProtectedOwnerConfirmationProps ) {
	const [ isConfirming, setIsConfirming ] = useState( false );
	const [ error, setError ] = useState< ProtectedOwnerConfirmError | null >( null );

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

		// The deprecated global is the fallback, not the first read: a page that only prints the
		// script data would otherwise post to a relative URL with an empty nonce.
		const state = getScriptData()?.connection || window.JP_CONNECTION_INITIAL_STATE;
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
			setError( toConfirmError( null ) );
			setIsConfirming( false );
			return;
		}

		const raw: unknown = await response.json().catch( () => null );

		if ( ! response.ok ) {
			setError( toConfirmError( raw ) );
			setIsConfirming( false );
			return;
		}

		onConfirmed?.();
		onClose();
	}, [ apiNonce, apiRoot, onClose, onConfirmed ] );

	if ( ! isOpen ) {
		return null;
	}

	const copy = getProtectedOwnerConfirmationCopy( { subject } );

	return (
		<Modal
			title={ copy.title }
			onRequestClose={ close }
			className="jp-protected-owner-confirmation"
		>
			<p>{ copy.body }</p>
			{ error && (
				<Notice status="error" isDismissible={ false }>
					{ error.message }
				</Notice>
			) }
			{ error?.code === PROTECTED_OWNER_CLAIMED_BY_OTHER && (
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
