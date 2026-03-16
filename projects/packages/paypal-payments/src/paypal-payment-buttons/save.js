/**
 * PayPal Payment Buttons — Save (Frontend Render) Component.
 *
 * Renders the PayPal payment button on the published page. For API-managed
 * blocks, renders a styled button linking to the PayPal payment URL. For
 * legacy paste-code blocks, renders the original script-based embed.
 *
 * Updated for WOOPTP-156: PayPal brand compliance and design guidelines.
 * Inline PayPal wordmark SVG, "Powered by PayPal" attribution, i18n button text,
 * flex layout for logo + text, and screen-reader text on new-tab links (WCAG 2.1).
 *
 * @package
 * @since 0.8.0
 */

import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Currency symbol map — must match paypal-button-preview.js and
 * class-paypal-payment-buttons.php for consistent WYSIWYG rendering.
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
 * PayPal logo SVG rendered inline.
 *
 * Per PayPal brand guidelines, the PayPal wordmark must appear on any
 * button or call-to-action that initiates a PayPal payment flow.
 *
 * Dimensions are omitted from the SVG element — CSS controls the rendered
 * size via .jetpack-paypal-button__logo to keep sizing consistent across
 * the editor preview and frontend.
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
 * Save component for the PayPal Payment Buttons block.
 *
 * @param {object} props            - Block props.
 * @param {object} props.attributes - Block attributes.
 * @return {Element} Rendered block for the frontend.
 */
export default function PayPalPaymentButtonsSave( { attributes } ) {
	const {
		isApiManaged,
		buttonType,
		scriptSrc,
		hostedButtonId,
		buttonText,
		paymentLink,
		productName,
		price,
		currencyCode,
		productDescription,
	} = attributes;

	const blockProps = useBlockProps.save();

	// API-managed V2 block — render styled button linking to PayPal payment URL.
	if ( isApiManaged && paymentLink ) {
		const isStacked = buttonType === 'stacked';

		return (
			<div { ...blockProps }>
				<div className="jetpack-paypal-button">
					{ /* Product info — flex layout matches editor preview */ }
					<div className="jetpack-paypal-button__product">
						<div className="jetpack-paypal-button__product-info">
							<span className="jetpack-paypal-button__product-name">{ productName }</span>
							{ productDescription && (
								<span className="jetpack-paypal-button__product-description">
									{ productDescription }
								</span>
							) }
						</div>
						{ price && (
							<span className="jetpack-paypal-button__product-price">
								{ ( CURRENCY_SYMBOLS[ currencyCode ] || currencyCode ) + price }
							</span>
						) }
					</div>

					{ /* PayPal button(s) */ }
					<div
						className={ `jetpack-paypal-button__buttons jetpack-paypal-button__buttons--${ buttonType }` }
					>
						{ /*
						 * Primary PayPal button.
						 *
						 * The PayPal wordmark (inline SVG) must appear on the button per
						 * PayPal brand guidelines. aria-hidden on the SVG keeps assistive
						 * technology focused on the visible button text for the accessible
						 * label. The screen-reader span announces the new-tab behaviour
						 * per WCAG 2.1 SC 3.2.2.
						 */ }
						<a
							href={ paymentLink }
							className="jetpack-paypal-button__paypal-link"
							target="_blank"
							rel="noopener noreferrer"
						>
							<PayPalLogo />
							<span className="jetpack-paypal-button__button-text">
								{ buttonText || __( 'Pay Now', 'jetpack-paypal-payments' ) }
							</span>
							<span className="screen-reader-text">
								{ __( '(opens in a new tab)', 'jetpack-paypal-payments' ) }
							</span>
						</a>

						{ isStacked && (
							<a
								href={ paymentLink }
								className="jetpack-paypal-button__debit-link"
								target="_blank"
								rel="noopener noreferrer"
							>
								{ __( 'Debit or Credit Card', 'jetpack-paypal-payments' ) }
								<span className="screen-reader-text">
									{ __( '(opens in a new tab)', 'jetpack-paypal-payments' ) }
								</span>
							</a>
						) }
					</div>

					{ /* PayPal brand attribution */ }
					<p className="jetpack-paypal-button__attribution">
						{ __( 'Powered by PayPal', 'jetpack-paypal-payments' ) }
					</p>
				</div>
			</div>
		);
	}

	// Legacy paste-code block — render the original script-based embed.
	// IMPORTANT: This markup must match the deprecated.js v040Alpha save
	// output after migration. Do NOT add extra classes that weren't in the
	// original — the deprecated entry handles matching the original stored
	// HTML without them.
	if ( scriptSrc && hostedButtonId ) {
		return (
			<div { ...blockProps }>
				<div
					className={ `jetpack-paypal-button jetpack-paypal-button--${ buttonType }` }
					id={ hostedButtonId }
				/>
			</div>
		);
	}

	// Fallback — empty block (should not normally occur).
	return <div { ...blockProps } />;
}
