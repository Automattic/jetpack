/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Button, Modal } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';
import type { ProtectedOwnerState, ProtectedOwnerStatus } from '../../types';

/** The connection store is untyped, so its selectors are described where they are used. */
type StoreSelector = ( storeId: string ) => {
	getProtectedOwnerStatus: () => ProtectedOwnerStatus | null;
	isCurrentUserTheProtectedOwner: () => boolean;
	getProtectedOwner: () => ProtectedOwnerState | null;
};

interface ProtectedOwnerDialogProps {
	/** Whether the dialog is open. */
	isOpen?: boolean;
	/** Callback for when the dialog is closed. */
	onClose: () => void;
	/** Called after the current user becomes the protected owner. */
	onEstablished?: () => void;
	/** Where a reconnect CTA should send the user. */
	connectUrl?: string;
	/** Recorded as the provenance of the claim. */
	confirmedBy?: string;
}

type Presentation = {
	title: string;
	body: string;
	/** Absent when the status offers the user nothing to do here. */
	action?: 'establish' | 'connect';
	actionLabel?: string;
};

/*
 * PLACEHOLDER COPY. Every string below is a stand-in for wording that has not been written yet —
 * it describes the state correctly but is not user-tested and is not final. The shape is what is
 * being proposed here: one presentation per resolver status, chosen by the server's classification
 * rather than re-derived in the client, so the dialog cannot disagree with the gate.
 */
const getPresentation = (
	status: ProtectedOwnerStatus | null,
	isCurrentUserTheOwner: boolean
): Presentation | null => {
	switch ( status ) {
		case 'CAN_ESTABLISH':
			return {
				title: __( 'Confirm you own this site', 'jetpack-connection-js' ),
				body: __(
					'PLACEHOLDER: Confirming locks this site to your WordPress.com account so features that pay out or bind to an owner stay with you.',
					'jetpack-connection-js'
				),
				action: 'establish',
				actionLabel: __( 'Yes, I own this site', 'jetpack-connection-js' ),
			};

		case 'NEEDS_CONNECT_TO_ESTABLISH':
			return {
				title: __( 'Connect your account first', 'jetpack-connection-js' ),
				body: __(
					'PLACEHOLDER: You need a connected WordPress.com account before this site can record you as its owner.',
					'jetpack-connection-js'
				),
				action: 'connect',
				actionLabel: __( 'Connect your account', 'jetpack-connection-js' ),
			};

		// Both reconnect states differ only in who has to act, which is the one thing the copy
		// must get right — telling the wrong person to reconnect is a dead end for them.
		case 'NEEDS_OWNER_RECONNECT':
		case 'NEEDS_DIFFERENT_OWNER':
			return isCurrentUserTheOwner
				? {
						title: __( 'Reconnect your account', 'jetpack-connection-js' ),
						body: __(
							'PLACEHOLDER: This site is owned by your account, but the connection needs restoring before owner-bound features work again.',
							'jetpack-connection-js'
						),
						action: 'connect',
						actionLabel: __( 'Reconnect', 'jetpack-connection-js' ),
				  }
				: {
						title: __( 'The site owner needs to connect', 'jetpack-connection-js' ),
						body: __(
							'PLACEHOLDER: This site is owned by a different WordPress.com account. That account has to connect before owner-bound features work.',
							'jetpack-connection-js'
						),
				  };

		case 'NOT_ELIGIBLE':
			return {
				title: __( 'An administrator is needed', 'jetpack-connection-js' ),
				body: __(
					'PLACEHOLDER: Only an administrator of this site can confirm who owns it.',
					'jetpack-connection-js'
				),
			};

		// The gate answered false and the state said otherwise, so the caller raced a change.
		// Nothing to show: whoever opened this should ask again rather than be told a stale reason.
		case 'RE_EVALUATE':
		default:
			return null;
	}
};

/**
 * Asks the protected-owner question, or explains why it cannot be asked yet.
 *
 * @param {ProtectedOwnerDialogProps} props - Component props.
 * @return {import('react').ReactNode} The ProtectedOwnerDialog component.
 */
const ProtectedOwnerDialog = ( {
	isOpen,
	onClose,
	onEstablished,
	connectUrl,
	confirmedBy = 'popup',
}: ProtectedOwnerDialogProps ) => {
	const [ isSubmitting, setIsSubmitting ] = useState( false );
	const [ error, setError ] = useState( '' );

	const { status, isCurrentUserTheOwner, isStateKnown } = useSelect( ( select: StoreSelector ) => {
		const store = select( STORE_ID );

		return {
			status: store.getProtectedOwnerStatus(),
			isCurrentUserTheOwner: store.isCurrentUserTheProtectedOwner(),
			isStateKnown: store.getProtectedOwner() !== null,
		};
	}, [] );

	const establish = useCallback( () => {
		setIsSubmitting( true );
		setError( '' );

		apiFetch( {
			path: '/jetpack/v4/connection/protected-owner',
			method: 'POST',
			data: { confirmed_by: confirmedBy },
		} )
			.then( () => {
				setIsSubmitting( false );
				onEstablished?.();
				onClose();
			} )
			.catch( ( e: { message?: string } ) => {
				setIsSubmitting( false );
				// Surfaced rather than swallowed: every refusal here is one the user can act on,
				// and failing closed silently looks identical to the feature being broken.
				setError(
					e?.message || __( 'Could not confirm the site owner.', 'jetpack-connection-js' )
				);
			} );
	}, [ confirmedBy, onClose, onEstablished ] );

	const presentation = getPresentation( status, isCurrentUserTheOwner );

	// Nothing renders on a state the server withheld: null means it could not say, which is not
	// the same as there being nothing to say.
	if ( ! isOpen || ! isStateKnown || ! presentation ) {
		return null;
	}

	return (
		<Modal title={ presentation.title } onRequestClose={ onClose }>
			<p>{ presentation.body }</p>

			{ error && <p className="protected-owner-dialog__error">{ error }</p> }

			<div className="protected-owner-dialog__actions">
				{ presentation.action === 'establish' && (
					<Button variant="primary" onClick={ establish } disabled={ isSubmitting }>
						{ isSubmitting
							? __( 'Confirming…', 'jetpack-connection-js' )
							: presentation.actionLabel }
					</Button>
				) }

				{ presentation.action === 'connect' && connectUrl && (
					<Button variant="primary" href={ connectUrl }>
						{ presentation.actionLabel }
					</Button>
				) }

				<Button variant="tertiary" onClick={ onClose }>
					{ __( 'Not now', 'jetpack-connection-js' ) }
				</Button>
			</div>
		</Modal>
	);
};

export default ProtectedOwnerDialog;
