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
import { getResourceAttributeUpdates } from '../utils/resource-sync';
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
 * @param {Function} props.setShowDeleteConfirm - Setter for the delete confirmation dialog.
 * @return {object} Resource state, its setters, and the delete handlers.
 */
export function usePayPalResource( {
	attributes,
	setAttributes,
	isConnected,
	setShowDeleteConfirm,
} ) {
	const { isApiManaged, resourceId } = attributes;

	const [ isBusy, setIsBusy ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ successMessage, setSuccessMessage ] = useState( null );

	// Two blocks can share one PayPal payment — a duplicate, or one product
	// shown as a button, a link and a QR code — and only the block that saved
	// last has seen what PayPal holds. Read it back so every block agrees.
	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch( blockEditorStore );
	const latestAttributes = useRef( attributes );
	latestAttributes.current = attributes;

	useEffect( () => {
		if ( ! isConnected || ! isApiManaged || ! resourceId ) {
			return;
		}

		let cancelled = false;

		apiFetch( { path: `${ API_BASE }/buttons/${ resourceId }` } )
			.then( response => {
				if ( cancelled || ! response?.attributes ) {
					return;
				}
				const updates = getResourceAttributeUpdates(
					latestAttributes.current,
					response.attributes
				);
				if ( ! Object.keys( updates ).length ) {
					return;
				}
				// Opening a post must not mark it dirty.
				__unstableMarkNextChangeAsNotPersistent?.();
				setAttributes( updates );
			} )
			// A payment deleted on PayPal is re-created when the post is next saved.
			.catch( () => {} );

		return () => {
			cancelled = true;
		};
	}, [
		isConnected,
		isApiManaged,
		resourceId,
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
				setSuccessMessage( __( 'PayPal button deleted.', 'jetpack-paypal-payments' ) );
			} )
			.catch( err => {
				// If already deleted (404), clear state anyway.
				if ( err.code === 'paypal_api_resource_not_found' || err.data?.status === 404 ) {
					setAttributes( {
						isApiManaged: false,
						resourceId: undefined,
						paymentLink: undefined,
					} );
					setSuccessMessage(
						__( 'Button was already removed from PayPal.', 'jetpack-paypal-payments' )
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
		handleDeleteButton,
		executeDeleteButton,
	};
}
