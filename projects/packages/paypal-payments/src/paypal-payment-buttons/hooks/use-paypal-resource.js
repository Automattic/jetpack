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
import { getResourceAttributeUpdates, withCurrency } from '../utils/resource-sync';
import { getUserFriendlyError } from '../utils/validation';

/**
 * Line-item fields set outside the block form.
 *
 * A PUT is a full replacement, so a field the request leaves out is one the
 * merchant deletes by pressing Update. These ride back out from the payment itself.
 */
const PAYPAL_ONLY_LINE_ITEM_FIELDS = [
	'product_id',
	'shipping',
	'handling',
	'discounts',
	'collect_shipping_address',
];

/**
 * Put the fields set outside the form back into an update request.
 *
 * @param {object} data     - The request built from the block's attributes.
 * @param {object} resource - The payment as it currently stands at PayPal.
 * @return {object} The request with those fields copied in.
 */
function keepPayPalOnlyFields( data, resource ) {
	const stored = resource?.line_items?.[ 0 ];
	if ( ! stored ) {
		return data;
	}

	const kept = {};
	PAYPAL_ONLY_LINE_ITEM_FIELDS.forEach( key => {
		if ( stored[ key ] !== undefined && stored[ key ] !== null ) {
			kept[ key ] = stored[ key ];
		}
	} );

	// PayPal's stored value wins: for these the form only ever sends its own
	// defaults.
	return { ...data, line_items: [ { ...data.line_items[ 0 ], ...kept } ] };
}

/**
 * The PayPal payment resource this block points at: creating it, updating it,
 * deleting it, and reading it back.
 *
 * @param {object}   props                      - Hook props.
 * @param {object}   props.attributes           - Block attributes.
 * @param {Function} props.setAttributes        - Function to update block attributes.
 * @param {boolean}  props.isConnected          - Whether the site is connected to PayPal.
 * @param {boolean}  props.usesVariantPricing   - Whether the options group carries its own prices.
 * @param {boolean}  props.isFormValid          - Whether the product form has no validation errors.
 * @param {Function} props.setIsEditing         - Setter for the edit/preview mode toggle.
 * @param {Function} props.setTouchedFields     - Setter for the touched-field map.
 * @param {Function} props.setShowDeleteConfirm - Setter for the delete confirmation dialog.
 * @return {object} Resource state, its setters, and the create/update/delete handlers.
 */
export function usePayPalResource( {
	attributes,
	setAttributes,
	isConnected,
	usesVariantPricing,
	isFormValid,
	setIsEditing,
	setTouchedFields,
	setShowDeleteConfirm,
} ) {
	const {
		isApiManaged,
		resourceId,
		productName,
		price,
		currencyCode,
		productDescription,
		returnUrl,
		variantsEnabled,
		variants,
		adjustableQuantity,
		maxQuantity,
		customerNotes,
		taxEnabled,
		taxType,
		taxName,
		taxValue,
		collectShippingAddress,
	} = attributes;

	// Form state.
	const [ isCreating, setIsCreating ] = useState( false );
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
			// A payment deleted on PayPal is re-created when the merchant next saves the block.
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
	 * Build the line_items payload from current attributes.
	 *
	 * @return {object} API request data.
	 */
	const buildRequestData = useCallback(
		() => ( {
			type: 'BUY_NOW',
			integration_mode: 'LINK',
			reusable: 'MULTIPLE',
			line_items: [
				{
					name: productName,
					// PayPal errors with "unit_amount is specified at both product
					// level and variant level" when both are present, so the
					// product-level amount is dropped once options are priced.
					...( usesVariantPricing
						? {}
						: {
								unit_amount: {
									currency_code: currencyCode || 'USD',
									value: price,
								},
						  } ),
					...( productDescription ? { description: productDescription } : {} ),
					...( variantsEnabled && variants
						? { variants: withCurrency( variants, currencyCode || 'USD' ) }
						: {} ),
					...( adjustableQuantity && maxQuantity > 1
						? { adjustable_quantity: { maximum: parseInt( maxQuantity, 10 ) } }
						: {} ),
					...( customerNotes?.length > 0
						? { customer_notes: customerNotes.filter( n => n.label?.trim() ) }
						: {} ),
					...( taxEnabled
						? {
								taxes: [
									{
										// PayPal supplies the label, so the name is
										// its own only when the payment already has
										// one. Sending an empty one would overwrite it.
										...( taxName ? { name: taxName } : {} ),
										type: taxType || 'PERCENTAGE',
										value: taxType === 'PREFERENCE' ? 'PROFILE' : taxValue || '0',
									},
								],
						  }
						: {} ),
					// Omitting this makes PayPal collect an address whatever the
					// payment said before, so it goes out on every request. On an
					// update the payment's own value replaces this one.
					collect_shipping_address: !! collectShippingAddress,
				},
			],
			...( returnUrl ? { return_url: returnUrl } : {} ),
		} ),
		[
			productName,
			price,
			currencyCode,
			productDescription,
			returnUrl,
			variantsEnabled,
			variants,
			usesVariantPricing,
			adjustableQuantity,
			maxQuantity,
			customerNotes,
			taxEnabled,
			taxType,
			taxName,
			taxValue,
			collectShippingAddress,
		]
	);

	/**
	 * Create a PayPal payment button via the API.
	 */
	const handleCreateButton = useCallback( () => {
		// Mark all fields as touched to show any remaining errors.
		setTouchedFields( {
			productName: true,
			price: true,
			currencyCode: true,
			productDescription: true,
		} );

		if ( ! isFormValid ) {
			return;
		}

		setError( null );
		setSuccessMessage( null );
		setIsCreating( true );

		apiFetch( {
			path: `${ API_BASE }/buttons`,
			method: 'POST',
			data: buildRequestData(),
		} )
			.then( response => {
				setAttributes( {
					isApiManaged: true,
					resourceId: response.id,
					paymentLink: response.payment_link,
				} );
				setSuccessMessage(
					__( 'PayPal button and payment link created successfully!', 'jetpack-paypal-payments' )
				);
				setIsEditing( false );
				setTouchedFields( {} );
			} )
			.catch( err => {
				setError( getUserFriendlyError( err ) );
			} )
			.finally( () => {
				setIsCreating( false );
			} );
	}, [ buildRequestData, setAttributes, isFormValid, setIsEditing, setTouchedFields ] );

	/**
	 * Update an existing PayPal payment button via the API.
	 */
	const handleUpdateButton = useCallback( () => {
		if ( ! resourceId ) {
			return;
		}

		// Mark all fields as touched to show any remaining errors.
		setTouchedFields( {
			productName: true,
			price: true,
			currencyCode: true,
			productDescription: true,
		} );

		if ( ! isFormValid ) {
			return;
		}

		setError( null );
		setSuccessMessage( null );
		setIsCreating( true );

		let isRecreating = false;

		// Read the payment first, and let a failed read stop the save: a blind PUT
		// would delete the fields the read was there to copy.
		apiFetch( { path: `${ API_BASE }/buttons/${ resourceId }` } )
			.then( resource =>
				apiFetch( {
					path: `${ API_BASE }/buttons/${ resourceId }`,
					method: 'PUT',
					data: keepPayPalOnlyFields( buildRequestData(), resource ),
				} )
			)
			.then( () => {
				// An update answers 204, so the route echoes the request back and the
				// payment link stays as it was.
				setSuccessMessage( __( 'PayPal button updated successfully!', 'jetpack-paypal-payments' ) );
				setIsEditing( false );
				setTouchedFields( {} );
			} )
			.catch( err => {
				// If the resource was deleted from PayPal (404 on either the read or
				// the write), automatically re-create it as a new button with the same
				// product data. This handles demo/playground blocks and buttons deleted
				// outside WordPress.
				if ( err.code === 'paypal_api_resource_not_found' || err.data?.status === 404 ) {
					isRecreating = true;
					apiFetch( {
						path: `${ API_BASE }/buttons`,
						method: 'POST',
						data: buildRequestData(),
					} )
						.then( response => {
							setAttributes( {
								isApiManaged: true,
								resourceId: response.id,
								paymentLink: response.payment_link,
							} );
							setSuccessMessage(
								__(
									'Button re-created on PayPal with a new payment link.',
									'jetpack-paypal-payments'
								)
							);
							setIsEditing( false );
							setTouchedFields( {} );
						} )
						.catch( createErr => {
							setError( getUserFriendlyError( createErr ) );
						} )
						.finally( () => {
							setIsCreating( false );
						} );
					return;
				}

				setError( getUserFriendlyError( err ) );
			} )
			.finally( () => {
				if ( ! isRecreating ) {
					setIsCreating( false );
				}
			} );
	}, [ resourceId, buildRequestData, setAttributes, isFormValid, setIsEditing, setTouchedFields ] );

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
		setIsCreating( true );

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
				setIsEditing( true );
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
					setIsEditing( true );
					setSuccessMessage(
						__( 'Button was already removed from PayPal.', 'jetpack-paypal-payments' )
					);
				} else {
					setError( getUserFriendlyError( err ) );
				}
			} )
			.finally( () => {
				setIsCreating( false );
			} );
	}, [ resourceId, setAttributes, setIsEditing, setShowDeleteConfirm ] );

	return {
		isCreating,
		error,
		setError,
		successMessage,
		setSuccessMessage,
		handleCreateButton,
		handleUpdateButton,
		handleDeleteButton,
		executeDeleteButton,
	};
}
