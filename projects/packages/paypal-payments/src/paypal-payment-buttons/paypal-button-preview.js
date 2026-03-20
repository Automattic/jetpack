/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Button Preview Component.
 *
 * Renders a styled preview of the PayPal payment button in the block editor.
 * Visually matches the frontend PayPal button rendering so merchants see
 * a WYSIWYG representation of what visitors will see on the published page.
 *
 * Updated for WOOPTP-156: Removed hardcoded SVG dimensions; sizing is now
 * controlled exclusively by CSS to ensure consistency across editor and
 * frontend views. Logo height is set via .jetpack-paypal-button__logo in
 * editor.scss.
 *
 * @package
 * @since 0.8.0
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { CURRENCY_SYMBOLS } from './currency-symbols';
import PayPalLogo from './paypal-logo';

/**
 * Format a price with currency symbol.
 *
 * @param {string} priceValue   - The price value string.
 * @param {string} currencyCode - The ISO currency code.
 * @return {string} Formatted price string.
 */
function formatPrice( priceValue, currencyCode ) {
	const symbol = CURRENCY_SYMBOLS[ currencyCode ] || currencyCode;
	return `${ symbol }${ priceValue }`;
}

/**
 * Copyable payment link with a "Copy" button.
 *
 * @param {object} props             - Component props.
 * @param {string} props.paymentLink - The payment link URL.
 * @return {Element} Payment link with copy button.
 */
function CopyablePaymentLink( { paymentLink } ) {
	const [ copied, setCopied ] = useState( false );

	const copiedLabel = __( 'Copied!', 'jetpack-paypal-payments' );
	const copyLabel = __( 'Copy', 'jetpack-paypal-payments' );

	const handleCopy = () => {
		if ( navigator.clipboard ) {
			navigator.clipboard.writeText( paymentLink ).then( () => {
				setCopied( true );
				setTimeout( () => setCopied( false ), 2000 );
			} );
		}
	};

	return (
		<div className="jetpack-paypal-button-preview__link-ref">
			<span className="jetpack-paypal-button-preview__link-label">
				{ __( 'Payment link:', 'jetpack-paypal-payments' ) }
			</span>
			<code className="jetpack-paypal-button-preview__link-url">{ paymentLink }</code>
			<button
				type="button"
				className="jetpack-paypal-button-preview__copy-button"
				onClick={ handleCopy }
				aria-label={ __( 'Copy payment link to clipboard', 'jetpack-paypal-payments' ) }
			>
				{ copied ? copiedLabel : copyLabel }
			</button>
		</div>
	);
}

/**
 * PayPal button preview component.
 *
 * Renders a styled button that visually matches the PayPal-branded button
 * appearance on the frontend. Clicking is disabled in the editor.
 *
 * @param {object}  props                    - Component props.
 * @param {string}  props.buttonText         - Text displayed on the button.
 * @param {string}  props.buttonType         - Layout type: 'stacked' or 'single'.
 * @param {string}  props.productName        - Product name to display.
 * @param {string}  props.price              - Price value string.
 * @param {string}  props.currencyCode       - ISO currency code.
 * @param {string}  props.productDescription - Optional product description.
 * @param {string}  props.paymentLink        - PayPal payment URL.
 * @param {boolean} props.variantsEnabled    - Whether variants are active.
 * @param {object}  props.variants           - Variants data with dimensions.
 * @param {string}  props.imageUrl           - Optional product image URL.
 * @return {Element} Button preview element.
 */
export default function PayPalButtonPreview( {
	buttonText,
	buttonType = 'stacked',
	productName,
	price,
	currencyCode = 'USD',
	productDescription,
	paymentLink,
	variantsEnabled,
	variants,
	imageUrl,
} ) {
	const isStacked = buttonType === 'stacked';

	return (
		<div className="jetpack-paypal-button-preview">
			{ /* Product image */ }
			{ imageUrl && (
				<div className="jetpack-paypal-button-preview__image">
					<img src={ imageUrl } alt={ productName || '' } />
				</div>
			) }

			{ /* Product info card */ }
			<div className="jetpack-paypal-button-preview__product">
				<div className="jetpack-paypal-button-preview__product-info">
					<span className="jetpack-paypal-button-preview__product-name">{ productName }</span>
					{ productDescription && (
						<span className="jetpack-paypal-button-preview__product-description">
							{ productDescription }
						</span>
					) }
				</div>
				{ price && (
					<span className="jetpack-paypal-button-preview__product-price">
						{ formatPrice( price, currencyCode ) }
					</span>
				) }
			</div>

			{ /* Variant summary */ }
			{ variantsEnabled && variants?.dimensions?.length > 0 && (
				<div className="jetpack-paypal-button-preview__variants">
					{ variants.dimensions.map( ( dim, i ) => (
						<span key={ i } className="jetpack-paypal-button-preview__variant-badge">
							{ dim.name }: { dim.options?.length || 0 }
						</span>
					) ) }
				</div>
			) }

			{ /* PayPal-styled button */ }
			<div
				className={ `jetpack-paypal-button-preview__buttons jetpack-paypal-button-preview__buttons--${ buttonType }` }
			>
				{ /* Non-interactive preview elements — use div, not <a role="button"> */ }
				<div className="jetpack-paypal-button-preview__paypal-button" aria-hidden="true">
					<PayPalLogo />
					<span className="jetpack-paypal-button-preview__button-text">
						{ buttonText || __( 'Pay Now', 'jetpack-paypal-payments' ) }
					</span>
				</div>

				{ isStacked && (
					<div className="jetpack-paypal-button-preview__debit-button" aria-hidden="true">
						{ __( 'Debit or Credit Card', 'jetpack-paypal-payments' ) }
					</div>
				) }
			</div>

			{ /* Payment link with copy button */ }
			<CopyablePaymentLink paymentLink={ paymentLink } />
		</div>
	);
}
