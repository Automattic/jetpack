import { getScriptData } from '@automattic/jetpack-script-data';
import { Button, Modal, Notice } from '@wordpress/components';
import { useCallback, useEffect, useState } from 'react';
import { getProtectedOwnerReleaseCopy } from './copy.ts';
import type { ProtectedOwnerReleaseError, ProtectedOwnerReleaseProps } from './types.ts';
import './style.scss';

/** REST error code for a caller WordPress.com does not hold as this site's owner. */
export const PROTECTED_OWNER_NOT_OWNER = 'protected_owner_not_owner';

/**
 * Read the refusal the server sent, falling back to the generic wording.
 *
 * The body is server JSON, so each field is checked rather than asserted.
 *
 * @param {unknown} raw - Parsed response body, or null when it did not parse.
 * @return {ProtectedOwnerReleaseError} Message to show, and the code when there is a usable one.
 */
function toReleaseError( raw: unknown ): ProtectedOwnerReleaseError {
	const body = !! raw && typeof raw === 'object' ? raw : {};
	const message = 'message' in body && typeof body.message === 'string' ? body.message : '';
	const code = 'code' in body && typeof body.code === 'string' ? body.code : undefined;

	return {
		message: message || getProtectedOwnerReleaseCopy().releaseError,
		code,
	};
}

/**
 * Ask the confirmed owner to give up this site's protected ownership.
 *
 * Accept posts to `POST /jetpack/v4/connection/owner/release`. Cancel leaves the site unchanged.
 *
 * @param {ProtectedOwnerReleaseProps} props - Component props.
 * @return {import('react').ReactNode} The dialog, or null when closed.
 */
export default function ProtectedOwnerRelease( {
	isOpen,
	onClose,
	onReleased,
	subject,
	apiRoot,
	apiNonce,
}: ProtectedOwnerReleaseProps ) {
	const [ isReleasing, setIsReleasing ] = useState( false );
	const [ error, setError ] = useState< ProtectedOwnerReleaseError | null >( null );

	useEffect( () => {
		if ( isOpen ) {
			setError( null );
			setIsReleasing( false );
		}
	}, [ isOpen ] );

	const close = useCallback( () => {
		if ( ! isReleasing ) {
			onClose();
		}
	}, [ isReleasing, onClose ] );

	const release = useCallback( async () => {
		setIsReleasing( true );
		setError( null );

		// The deprecated global is the fallback, not the first read: a page that only prints the
		// script data would otherwise post to a relative URL with an empty nonce.
		const state = getScriptData()?.connection || window.JP_CONNECTION_INITIAL_STATE;
		const root = apiRoot || state?.apiRoot || '';
		const nonce = apiNonce || state?.apiNonce || '';
		const endpoint = `${ root.replace( /\/?$/, '/' ) }jetpack/v4/connection/owner/release`;

		let response: Response;
		try {
			response = await fetch( endpoint, {
				method: 'POST',
				headers: {
					'X-WP-Nonce': nonce,
				},
			} );
		} catch {
			setError( toReleaseError( null ) );
			setIsReleasing( false );
			return;
		}

		const raw: unknown = await response.json().catch( () => null );

		if ( ! response.ok ) {
			setError( toReleaseError( raw ) );
			setIsReleasing( false );
			return;
		}

		onReleased?.();
		onClose();
	}, [ apiNonce, apiRoot, onClose, onReleased ] );

	if ( ! isOpen ) {
		return null;
	}

	const copy = getProtectedOwnerReleaseCopy( { subject } );

	return (
		<Modal title={ copy.title } onRequestClose={ close } className="jp-protected-owner-release">
			<p>{ copy.body }</p>
			{ error && (
				<Notice status="error" isDismissible={ false }>
					{ error.message }
				</Notice>
			) }
			{ error?.code === PROTECTED_OWNER_NOT_OWNER && (
				<p>
					<a href={ copy.supportUrl }>{ copy.contactSupport }</a>
				</p>
			) }
			<div className="jp-protected-owner-release__actions">
				<Button variant="tertiary" onClick={ close } disabled={ isReleasing }>
					{ copy.cancel }
				</Button>
				<Button
					variant="primary"
					isDestructive
					onClick={ release }
					isBusy={ isReleasing }
					disabled={ isReleasing }
				>
					{ copy.release }
				</Button>
			</div>
		</Modal>
	);
}
