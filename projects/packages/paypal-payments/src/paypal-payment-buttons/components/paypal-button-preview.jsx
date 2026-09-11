/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Button Preview Component.
 *
 * Renders the block's Display Format in the editor canvas — a button card, a
 * payment link, or a QR code. Each is an abbreviated view of what the frontend
 * renders for that format, so the canvas shows which one the merchant picked.
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
import QrCodePreview from './qr-code-preview';
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
 * The LINK format — a bare anchor, the same as the frontend.
 *
 * @param {object} props                      - Component props.
 * @param {string} props.productName          - Product name, which is also the link label.
 * @param {string} props.paymentLink          - PayPal payment URL, once one has been issued.
 * @param {string} props.partnerAttributionId - PayPal partner attribution (BN) code.
 * @return {Element} Link preview element.
 */
function LinkPreview( { productName, paymentLink, partnerAttributionId } ) {
	// Mirrors render_api_managed_button()'s LINK branch.
	const label = productName || __( 'Pay with PayPal', 'jetpack-paypal-payments' );

	return (
		<div className="jetpack-paypal-button-preview jetpack-paypal-button-preview--link">
			{ /* A real anchor, so the theme styles it the way it styles the published one. */ }
			<a
				href={ withPartnerAttribution( paymentLink, partnerAttributionId ) }
				className="jetpack-paypal-button__paypal-link"
				onClick={ event => event.preventDefault() }
			>
				{ label }
			</a>
		</div>
	);
}

/**
 * The QR format — the code, its label, and the attribution line.
 *
 * Copy and Download belong to the frontend and the inspector, so the canvas
 * draws the code on its own.
 *
 * @param {object} props                      - Component props.
 * @param {string} props.productName          - Product name shown below the code.
 * @param {string} props.paymentLink          - PayPal payment URL, once one has been issued.
 * @param {string} props.partnerAttributionId - PayPal partner attribution (BN) code.
 * @return {Element} QR preview element.
 */
function QrPreview( { productName, paymentLink, partnerAttributionId } ) {
	// Encode the attributed URL, so the editor's code and the frontend's send a
	// buyer through the same link.
	const qrUrl = withPartnerAttribution( paymentLink, partnerAttributionId );

	return (
		<div className="jetpack-paypal-button-preview jetpack-paypal-button-preview--qr">
			<QrCodePreview url={ qrUrl } className="jetpack-paypal-button__qr-canvas" />
			{ productName && <p className="jetpack-paypal-button__qr-product-name">{ productName }</p> }
			<p className="jetpack-paypal-button__attribution">
				{ __( 'Powered by PayPal', 'jetpack-paypal-payments' ) }
			</p>
		</div>
	);
}

/**
 * The BUTTON format — the product card and a theme-native checkout button.
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
function ButtonPreview( {
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
				<div
					className="jetpack-paypal-button-preview__checkout-button wp-element-button"
					aria-hidden="true"
				>
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

/**
 * The block's canvas preview, by Display Format.
 *
 * @param {object} props        - Component props. The rest go to the format's own preview.
 * @param {string} props.format - Display format: BUTTON, LINK or QR.
 * @return {Element} The preview for that format.
 */
export default function PayPalButtonPreview( { format, ...props } ) {
	// An unknown format falls back to the button, the same way
	// render_api_managed_button() validates it server-side.
	switch ( format ) {
		case 'LINK':
			return <LinkPreview { ...props } />;
		case 'QR':
			return <QrPreview { ...props } />;
		default:
			return <ButtonPreview { ...props } />;
	}
}
