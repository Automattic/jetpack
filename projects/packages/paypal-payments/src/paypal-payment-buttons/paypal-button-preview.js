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

/**
 * PayPal logo SVG rendered inline to avoid external requests in the editor.
 *
 * Dimensions are intentionally omitted from the SVG element — CSS
 * (.jetpack-paypal-button__logo) controls the rendered size to keep
 * the logo visually consistent between editor preview and frontend.
 *
 * @return {Element} PayPal logo SVG.
 */
function PayPalLogo() {
	return (
		<svg
			className="jetpack-paypal-button__logo"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 101 32"
			aria-hidden="true"
			focusable="false"
		>
			<path
				d="M12.5 4.7h-7c-.5 0-.9.3-1 .8L1.6 25c0 .3.2.6.6.6h3.3c.5 0 .9-.3 1-.8l.8-5.4c0-.5.5-.8 1-.8h2.3c4.7 0 7.4-2.3 8.1-6.8.3-2 0-3.5-.9-4.6C16.7 5.5 14.9 4.7 12.5 4.7zm.8 6.7c-.4 2.6-2.3 2.6-4.2 2.6h-1l.8-4.8c0-.3.3-.5.6-.5h.5c1.3 0 2.5 0 3.1.7.4.5.5 1.2.2 2z"
				fill="#253B80"
			/>
			<path
				d="M35.2 11.3h-3.3c-.3 0-.5.2-.6.5l-.1.9-.2-.3c-.7-1-2.2-1.3-3.7-1.3-3.5 0-6.4 2.6-7 6.3-.3 1.8.1 3.6 1.2 4.8 1 1.1 2.4 1.6 4.1 1.6 2.9 0 4.5-1.9 4.5-1.9l-.1.9c0 .3.2.6.6.6h3c.5 0 .9-.3 1-.8l1.8-11.5c-.1-.4-.4-.8-.7-.8zm-4.5 6.1c-.3 1.8-1.8 3-3.6 3-.9 0-1.6-.3-2.1-.8-.4-.5-.6-1.3-.5-2.1.3-1.8 1.8-3 3.6-3 .9 0 1.6.3 2.1.8.4.6.6 1.3.5 2.1z"
				fill="#253B80"
			/>
			<path
				d="M55.1 11.3h-3.4c-.3 0-.6.2-.8.4l-4.5 6.6-1.9-6.4c-.1-.4-.5-.6-.9-.6h-3.3c-.4 0-.7.4-.5.7l3.6 10.5-3.4 4.8c-.3.4 0 .9.4.9h3.3c.3 0 .6-.1.8-.4l10.9-15.7c.3-.4 0-.8-.3-.8z"
				fill="#253B80"
			/>
			<path
				d="M67.4 4.7h-7c-.5 0-.9.3-1 .8L56.5 25c0 .3.2.6.6.6h3.5c.3 0 .6-.2.7-.6l.8-5.2c0-.5.5-.8 1-.8h2.3c4.7 0 7.4-2.3 8.1-6.8.3-2 0-3.5-.9-4.6-1.1-1.2-2.9-1.9-5.2-1.9zm.8 6.7c-.4 2.6-2.3 2.6-4.2 2.6h-1l.8-4.8c0-.3.3-.5.6-.5h.5c1.3 0 2.5 0 3.1.7.3.5.4 1.2.2 2z"
				fill="#179BD7"
			/>
			<path
				d="M90.1 11.3h-3.3c-.3 0-.5.2-.6.5l-.1.9-.2-.3c-.7-1-2.2-1.3-3.7-1.3-3.5 0-6.4 2.6-7 6.3-.3 1.8.1 3.6 1.2 4.8 1 1.1 2.4 1.6 4.1 1.6 2.9 0 4.5-1.9 4.5-1.9l-.1.9c0 .3.2.6.6.6h3c.5 0 .9-.3 1-.8l1.8-11.5c-.1-.4-.3-.8-.7-.8zm-4.5 6.1c-.3 1.8-1.8 3-3.6 3-.9 0-1.6-.3-2.1-.8-.4-.5-.6-1.3-.5-2.1.3-1.8 1.8-3 3.6-3 .9 0 1.6.3 2.1.8.4.6.5 1.3.5 2.1z"
				fill="#179BD7"
			/>
			<path
				d="M95.1 5.2l-3 19.9c0 .3.2.6.6.6h2.9c.5 0 .9-.3 1-.8L99.5 5.5c0-.3-.2-.6-.6-.6h-3.2c-.2 0-.5.1-.6.3z"
				fill="#179BD7"
			/>
		</svg>
	);
}

/**
 * Currency symbol map for common currencies.
 */
const CURRENCY_SYMBOLS = {
	USD: '$',
	EUR: '\u20AC',
	GBP: '\u00A3',
	JPY: '\u00A5',
	CAD: 'CA$',
	AUD: 'A$',
	CHF: 'CHF',
	CNY: '\u00A5',
	INR: '\u20B9',
	BRL: 'R$',
	MXN: 'MX$',
	HKD: 'HK$',
	NZD: 'NZ$',
	SGD: 'S$',
	SEK: 'kr',
	NOK: 'kr',
	DKK: 'kr',
	PLN: 'z\u0142',
	CZK: 'K\u010D',
	HUF: 'Ft',
	ILS: '\u20AA',
	MYR: 'RM',
	PHP: '\u20B1',
	TWD: 'NT$',
	THB: '\u0E3F',
	RUB: '\u20BD',
};

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
				{ copied
					? __( 'Copied!', 'jetpack-paypal-payments' )
					: __( 'Copy', 'jetpack-paypal-payments' ) }
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
 * @param {object} props                    - Component props.
 * @param {string} props.buttonText         - Text displayed on the button.
 * @param {string} props.buttonType         - Layout type: 'stacked' or 'single'.
 * @param {string} props.productName        - Product name to display.
 * @param {string} props.price              - Price value string.
 * @param {string} props.currencyCode       - ISO currency code.
 * @param {string} props.productDescription - Optional product description.
 * @param {string} props.paymentLink        - PayPal payment URL.
 * @param {string} props.imageUrl           - Optional product image URL.
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
