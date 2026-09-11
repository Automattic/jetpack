/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Button Preview Component.
 *
 * Renders the block's Display Format in the editor canvas — a button card, a
 * payment link, or a QR code. Each is an abbreviated view of what the frontend
 * renders for that format, so the canvas shows which one the merchant picked.
 *
 * Sizing comes from CSS alone. Anything using a frontend class name is styled by
 * style.scss, which the canvas iframe loads too.
 *
 * @package
 * @since 0.8.0
 */

import { __, sprintf } from '@wordpress/i18n';
import { CURRENCY_SYMBOLS } from '../utils/currency-symbols';
import { withPartnerAttribution } from '../utils/partner-attribution';
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
 * Build the variant summary the way render_api_managed_button() builds it.
 *
 * Drops nameless dimensions and unlabeled options, and hides an option price
 * that only repeats the product price above it.
 *
 * @param {object} variants     - Variants data with dimensions.
 * @param {string} productPrice - The headline price, or '' when the options carry their own.
 * @return {Array} Groups of `{ name, options: [ { label, price } ] }`.
 */
function getVariantGroups( variants, productPrice ) {
	return ( variants?.dimensions || [] )
		.filter( dimension => dimension.name && dimension.options?.length )
		.map( dimension => ( {
			name: dimension.name,
			options: dimension.options
				.filter( option => option.label )
				.map( option => {
					const value = `${ option.unit_amount?.value ?? '' }`;
					return {
						label: option.label,
						price: value !== '' && value !== productPrice ? value : '',
					};
				} ),
		} ) )
		.filter( group => group.options.length > 0 );
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
 * @param {object}  props                    - Component props.
 * @param {string}  props.productName        - Product name to display.
 * @param {string}  props.price              - Price value string.
 * @param {string}  props.currencyCode       - ISO currency code.
 * @param {string}  props.productDescription - Optional product description.
 * @param {boolean} props.variantsEnabled    - Whether variants are active.
 * @param {object}  props.variants           - Variants data with dimensions.
 * @param {string}  props.imageUrl           - Optional product image URL.
 * @param {string}  props.buttonText         - Label on the checkout button.
 * @return {Element} Button preview element.
 */
function ButtonPreview( {
	productName,
	price,
	currencyCode = 'USD',
	productDescription,
	variantsEnabled,
	variants,
	imageUrl,
	buttonText,
} ) {
	// Mirrors render_api_managed_button(): PayPal drops the product-level amount
	// once the options have their own prices, but the block keeps what was typed.
	// Prices stay strings, because PayPal accepts 0 and the empty test is ''.
	const productPrice = hasVariantPricing( variantsEnabled, variants ) ? '' : `${ price ?? '' }`;
	const lowestVariantPrice =
		productPrice === '' && variantsEnabled ? getLowestVariantPrice( variants ) : null;
	const variantGroups = variantsEnabled ? getVariantGroups( variants, productPrice ) : [];
	// A blank label would draw an unreadable button, so fall back to the
	// block.json default, the same as render_api_managed_button() does.
	const label = `${ buttonText ?? '' }`.trim() || __( 'Buy Now', 'jetpack-paypal-payments' );

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
				{ productPrice !== '' && (
					<span className="jetpack-paypal-button-preview__product-price">
						{ formatPrice( productPrice, currencyCode ) }
					</span>
				) }
				{ productPrice === '' && lowestVariantPrice !== null && (
					<span className="jetpack-paypal-button-preview__product-price">
						{ sprintf(
							/* translators: %s: formatted price, e.g. "$29.99" */
							__( 'From %s', 'jetpack-paypal-payments' ),
							formatPrice( lowestVariantPrice, currencyCode )
						) }
					</span>
				) }
			</div>

			{ /* Variant summary — the frontend's markup and class names, so both sides look alike. */ }
			{ variantGroups.length > 0 && (
				<div className="jetpack-paypal-button__variants">
					<p className="jetpack-paypal-button__variants-label">
						{ __( 'Options available — select at checkout:', 'jetpack-paypal-payments' ) }
					</p>
					{ variantGroups.map( ( group, i ) => (
						<div key={ i } className="jetpack-paypal-button__variant-group">
							<span className="jetpack-paypal-button__variant-name">{ group.name }:</span>{ ' ' }
							{ group.options.map( ( option, j ) => (
								<span key={ j } className="jetpack-paypal-button__variant-option">
									{ option.label }
									{ option.price && (
										<>
											{ ' ' }
											<span className="jetpack-paypal-button__variant-price">
												{ formatPrice( option.price, currencyCode ) }
											</span>
										</>
									) }
								</span>
							) ) }
						</div>
					) ) }
				</div>
			) }

			{ /* Checkout button preview — theme-native, labeled with the buttonText attribute. */ }
			<div className="jetpack-paypal-button-preview__buttons">
				<div
					className="jetpack-paypal-button-preview__checkout-button wp-element-button"
					aria-hidden="true"
				>
					<span className="jetpack-paypal-button__button-text">{ label }</span>
				</div>
			</div>

			<p className="jetpack-paypal-button__attribution">
				{ __( 'Powered by PayPal', 'jetpack-paypal-payments' ) }
			</p>
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
