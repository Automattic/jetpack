/**
 * PayPal Payment Buttons — The PayPal payment resource.
 *
 * @package
 */

import apiFetch from '@wordpress/api-fetch'; // eslint-disable-line import/no-unresolved
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { API_BASE } from '../utils/api-base';
import { getResourceAttributeUpdates, isSameValue } from '../utils/resource-sync';
import { isNotFound, recordBlockMounted, recordPaymentRead } from '../utils/sync-on-save';
import { getUserFriendlyError } from '../utils/validation';

/**
 * The PayPal payment resource this block points at: reading it back and
 * deleting it. Creating and updating happen with the post save, in
 * utils/sync-on-save.js.
 *
 * @param {object}   props                      - Hook props.
 * @param {object}   props.attributes           - Block attributes.
 * @param {Function} props.setAttributes        - Function to update block attributes.
 * @param {boolean}  props.isConnected          - Whether the site is connected to PayPal.
 * @param {string}   props.clientId             - The block's client id.
 * @param {Function} props.setShowDeleteConfirm - Setter for the delete confirmation dialog.
 * @return {object} Resource state, its setters, and the delete handlers.
 */
export function usePayPalResource( {
	attributes,
	setAttributes,
	isConnected,
	clientId,
	setShowDeleteConfirm,
} ) {
	const { isApiManaged, resourceId } = attributes;

	const [ isBusy, setIsBusy ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ successMessage, setSuccessMessage ] = useState( null );
	const [ linkDeleted, setLinkDeleted ] = useState( false );
	const [ paymentChanged, setPaymentChanged ] = useState( false );

	// Two blocks can share one PayPal payment — a duplicate, or one product
	// shown as a button, a link and a QR code — and only the block that saved
	// last has seen what PayPal holds. Read it back so every block agrees.
	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch( blockEditorStore );
	const latestAttributes = useRef( attributes );
	latestAttributes.current = attributes;

	useEffect( () => {
		// Above the guard: deleting the button re-runs this with no resourceId, and a
		// warning about a payment that is gone has to clear too.
		setLinkDeleted( false );
		setPaymentChanged( false );

		// Above the early return: the block rendered even when there is no payment to fetch.
		recordBlockMounted( clientId );

		if ( ! isConnected || ! isApiManaged || ! resourceId ) {
			return;
		}

		let cancelled = false;
		const atRequest = latestAttributes.current;

		apiFetch( { path: `${ API_BASE }/buttons/${ resourceId }` } )
			.then( response => {
				if ( cancelled || ! response?.attributes ) {
					return;
				}
				// The block now has PayPal's values, so the save can write this payment.
				recordPaymentRead( clientId, resourceId );
				// Take PayPal's value only where the attribute still matches what the block had
				// when the request went out; anything else is the merchant's own edit.
				const updates = Object.fromEntries(
					Object.entries( getResourceAttributeUpdates( atRequest, response.attributes ) ).filter(
						( [ key ] ) => isSameValue( key, latestAttributes.current[ key ], atRequest[ key ] )
					)
				);
				if ( ! Object.keys( updates ).length ) {
					return;
				}
				setPaymentChanged( true );
				// Opening a post must not mark it dirty.
				__unstableMarkNextChangeAsNotPersistent?.();
				setAttributes( updates );
			} )
			// A payment deleted on PayPal is re-created when the post is next saved,
			// so the merchant is told before that happens.
			.catch( err => {
				if ( cancelled || ! isNotFound( err ) ) {
					return;
				}
				// A 404 counts as the read, so the save can run and re-create the payment.
				recordPaymentRead( clientId, resourceId );
				setLinkDeleted( true );
			} );

		return () => {
			cancelled = true;
		};
	}, [
		isConnected,
		isApiManaged,
		resourceId,
		clientId,
		setAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	/**
	 * Request delete confirmation via ConfirmDialog.
	 * Actual deletion runs in executeDeleteButton().
	 */
	const handleDeleteButton = useCallback( () => {
		if ( ! resourceId ) {
			return;
		}
		setShowDeleteConfirm( true );
	}, [ resourceId, setShowDeleteConfirm ] );

	/**
	 * Execute the button deletion after the user confirms.
	 */
	const executeDeleteButton = useCallback( () => {
		setShowDeleteConfirm( false );
		setError( null );
		setIsBusy( true );

		apiFetch( {
			path: `${ API_BASE }/buttons/${ resourceId }`,
			method: 'DELETE',
		} )
			.then( () => {
				setAttributes( {
					isApiManaged: false,
					resourceId: undefined,
					paymentLink: undefined,
				} );
				setSuccessMessage( __( 'Payment link deleted.', 'jetpack-paypal-payments' ) );
			} )
			.catch( err => {
				// If already deleted (404), clear state anyway.
				if ( isNotFound( err ) ) {
					setAttributes( {
						isApiManaged: false,
						resourceId: undefined,
						paymentLink: undefined,
					} );
					setSuccessMessage(
						__( 'The payment link was already removed from PayPal.', 'jetpack-paypal-payments' )
					);
				} else {
					setError( getUserFriendlyError( err ) );
				}
			} )
			.finally( () => {
				setIsBusy( false );
			} );
	}, [ resourceId, setAttributes, setShowDeleteConfirm ] );

	return {
		isBusy,
		error,
		setError,
		successMessage,
		setSuccessMessage,
		linkDeleted,
		paymentChanged,
		handleDeleteButton,
		executeDeleteButton,
	};
}
