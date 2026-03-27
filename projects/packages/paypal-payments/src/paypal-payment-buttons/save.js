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
import { CURRENCY_SYMBOLS } from './currency-symbols';
import PayPalLogo from './paypal-logo';

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
		paymentLink,
		productName,
		price,
		currencyCode,
		productDescription,
		imageUrl,
	} = attributes;

	const blockProps = useBlockProps.save();

	// API-managed V2 block — render styled button linking to PayPal payment URL.
	if ( isApiManaged && paymentLink ) {
		return (
			<div { ...blockProps }>
				<div className="jetpack-paypal-button">
					{ /* Product image */ }
					{ imageUrl && (
						<div className="jetpack-paypal-button__product-image">
							<img src={ imageUrl } alt={ productName || '' } />
						</div>
					) }

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

					{ /* Checkout button — theme-native styling via wp-element-button
					 * with the PayPal wordmark inline. Screen-reader span announces
					 * new-tab behaviour per WCAG 2.1 SC 3.2.2.
					 */ }
					<div className="jetpack-paypal-button__buttons">
						<a
							href={ paymentLink }
							className="jetpack-paypal-button__checkout-link wp-element-button"
							target="_blank"
							rel="noopener noreferrer"
						>
							<span className="jetpack-paypal-button__button-text">
								{ __( 'Buy Now With', 'jetpack-paypal-payments' ) }
							</span>
							<PayPalLogo />
							<span className="screen-reader-text">
								{ __( 'PayPal (opens in a new tab)', 'jetpack-paypal-payments' ) }
							</span>
						</a>
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
