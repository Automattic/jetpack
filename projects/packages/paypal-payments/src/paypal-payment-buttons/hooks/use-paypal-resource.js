/**
 * PayPal Payment Buttons — The PayPal payment resource.
 *
 * @package
 */

import apiFetch from '@wordpress/api-fetch'; // eslint-disable-line import/no-unresolved
import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { API_BASE } from '../utils/api-base';
import { getResourceAttributeUpdates, isBookkeeping, isSameValue } from '../utils/resource-sync';
import { isNotFound, recordBlockMounted, recordPaymentRead } from '../utils/sync-on-save';
import { toast } from '../utils/toast';
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
 * @return {object} The payment as last read, resource state, and the delete handlers.
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
	const [ linkDeleted, setLinkDeleted ] = useState( false );
	const [ paymentChanged, setPaymentChanged ] = useState( false );
	// What PayPal holds, with the site's own embed count - the details view reads it.
	const [ resource, setResource ] = useState( null );

	// The screen showing the warning decides when the merchant is done with it.
	const dismissPaymentChanged = useCallback( () => setPaymentChanged( false ), [] );

	// Two blocks can share one PayPal payment — a duplicate, or one product
	// shown as a button, a link and a QR code — and only the block that saved
	// last has seen what PayPal holds. Read it back so every block agrees.
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
		setResource( null );

		apiFetch( { path: `${ API_BASE }/buttons/${ resourceId }` } )
			.then( response => {
				if ( cancelled ) {
					return;
				}
				setResource( response || null );
				if ( ! response?.attributes ) {
					return;
				}
				// The block now has PayPal's values, so the save can write this payment.
				recordPaymentRead( clientId, resourceId, response.attributes );
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
				// The mode, and a first SDK URL, are the block catching up with the payment
				// rather than a change someone made at PayPal.
				if (
					Object.keys( updates ).some(
						key => ! isBookkeeping( key, atRequest[ key ], atRequest.format )
					)
				) {
					setPaymentChanged( true );
				}
				// An ordinary edit, so the post is dirty: the page renders the saved values, and
				// they are stale until the post is saved again.
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
	}, [ isConnected, isApiManaged, resourceId, clientId, setAttributes ] );

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
		setIsBusy( true );

		const clearPayment = message => {
			setAttributes( {
				isApiManaged: false,
				resourceId: undefined,
				paymentLink: undefined,
				scriptSrc: undefined,
				integrationMode: undefined,
			} );
			toast( 'success', message );
		};

		apiFetch( {
			path: `${ API_BASE }/buttons/${ resourceId }`,
			method: 'DELETE',
		} )
			.then( () => clearPayment( __( 'Payment link deleted.', 'jetpack-paypal-payments' ) ) )
			.catch( err => {
				// Already deleted on PayPal's side (404), so clear the block anyway.
				if ( isNotFound( err ) ) {
					clearPayment(
						__( 'The payment link was already removed from PayPal.', 'jetpack-paypal-payments' )
					);
				} else {
					toast( 'error', getUserFriendlyError( err ) );
				}
			} )
			.finally( () => {
				setIsBusy( false );
			} );
	}, [ resourceId, setAttributes, setShowDeleteConfirm ] );

	return {
		resource,
		isBusy,
		linkDeleted,
		paymentChanged,
		dismissPaymentChanged,
		handleDeleteButton,
		executeDeleteButton,
	};
}
