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
		buttonText,
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
		const isStacked = buttonType === 'stacked';

		return (
			<div { ...blockProps }>
				<div className="jetpack-paypal-button">
					{ /* Product image */ }
					{ imageUrl && (
						<div className="jetpack-paypal-button__image">
							<img src={ imageUrl } alt={ productName || '' } loading="lazy" />
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
