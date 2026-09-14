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
import { __, sprintf } from '@wordpress/i18n';
import { CURRENCY_SYMBOLS } from '../utils/currency-symbols';
import { withPartnerAttribution } from '../utils/partner-attribution';
import PayPalLogo from './paypal-logo';
import { getPrimaryDimension, hasVariantPricing } from './variant-builder';

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
 * Find the cheapest per-option price in the primary option group.
 *
 * PayPal only prices the primary group, so an amount left on another group is
 * not a price a buyer can pay and must not become the headline.
 *
 * @param {object} variants - Variants data with dimensions.
 * @return {string|null} The lowest option price, or null when none are priced.
 */
function getLowestVariantPrice( variants ) {
	let lowest = null;

	( getPrimaryDimension( variants )?.options || [] ).forEach( opt => {
		const value = `${ opt.unit_amount?.value ?? '' }`.trim();
		if ( value === '' || isNaN( parseFloat( value ) ) ) {
			return;
		}
		if ( lowest === null || parseFloat( value ) < parseFloat( lowest ) ) {
			lowest = value;
		}
	} );

	return lowest;
}

/**
 * Copyable payment link with a "Copy" button.
 *
 * @param {object} props                      - Component props.
 * @param {string} props.paymentLink          - The payment link URL.
 * @param {string} props.partnerAttributionId - PayPal partner attribution (BN) code.
 * @return {Element} Payment link with copy button.
 */
function CopyablePaymentLink( { paymentLink, partnerAttributionId } ) {
	const [ copied, setCopied ] = useState( false );

	const copiedLabel = __( 'Copied!', 'jetpack-paypal-payments' );
	const copyLabel = __( 'Copy', 'jetpack-paypal-payments' );

	// Merchants share this link directly, so it carries the same attribution
	// code the rendered button appends.
	const shareableLink = withPartnerAttribution( paymentLink, partnerAttributionId );

	const handleCopy = () => {
		if ( navigator.clipboard ) {
			navigator.clipboard.writeText( shareableLink ).then( () => {
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
			<code className="jetpack-paypal-button-preview__link-url">{ shareableLink }</code>
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
 * @param {object}  props                      - Component props.
 * @param {string}  props.productName          - Product name to display.
 * @param {string}  props.price                - Price value string.
 * @param {string}  props.currencyCode         - ISO currency code.
 * @param {string}  props.productDescription   - Optional product description.
 * @param {string}  props.paymentLink          - PayPal payment URL, once one has been issued.
 * @param {boolean} props.variantsEnabled      - Whether variants are active.
 * @param {object}  props.variants             - Variants data with dimensions.
 * @param {string}  props.imageUrl             - Optional product image URL.
 * @param {string}  props.partnerAttributionId - PayPal partner attribution (BN) code.
 * @return {Element} Button preview element.
 */
export default function PayPalButtonPreview( {
	productName,
	price,
	currencyCode = 'USD',
	productDescription,
	paymentLink,
	variantsEnabled,
	variants,
	imageUrl,
	partnerAttributionId,
} ) {
	// Mirrors render_api_managed_button(): PayPal drops the product-level amount
	// once the options have their own prices, but the block keeps what was typed.
	const productPrice = hasVariantPricing( variantsEnabled, variants ) ? '' : price;
	const lowestVariantPrice =
		! productPrice && variantsEnabled ? getLowestVariantPrice( variants ) : null;

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
				{ productPrice && (
					<span className="jetpack-paypal-button-preview__product-price">
						{ formatPrice( productPrice, currencyCode ) }
					</span>
				) }
				{ ! productPrice && lowestVariantPrice && (
					<span className="jetpack-paypal-button-preview__product-price">
						{ sprintf(
							/* translators: %s: formatted price, e.g. "$29.99" */
							__( 'From %s', 'jetpack-paypal-payments' ),
							formatPrice( lowestVariantPrice, currencyCode )
						) }
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

			{ /* Checkout button preview — theme-native style with PayPal wordmark */ }
			<div className="jetpack-paypal-button-preview__buttons">
				<div className="jetpack-paypal-button-preview__checkout-button" aria-hidden="true">
					<span>{ __( 'Buy Now With', 'jetpack-paypal-payments' ) }</span>
					<PayPalLogo />
				</div>
			</div>

			{ /* Payment link with copy button — only once PayPal has issued one. */ }
			{ paymentLink && (
				<CopyablePaymentLink
					paymentLink={ paymentLink }
					partnerAttributionId={ partnerAttributionId }
				/>
			) }
		</div>
	);
}
