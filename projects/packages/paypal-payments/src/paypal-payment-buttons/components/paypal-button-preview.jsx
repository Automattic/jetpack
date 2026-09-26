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

import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import {
	getButtonStyle,
	getMarginStyle,
	getTextStyle,
	getWidthAndBorderStyle,
	getWidthStyle,
	isOutlineButton,
} from '../utils/block-styles';
import { formatPrice } from '../utils/currency-symbols';
import { DEFAULT_LABEL } from '../utils/defaults';
import { linkPrice } from '../utils/link-price';
import { withPartnerAttribution } from '../utils/partner-attribution';
import { getCardRevision } from '../utils/sync-on-save';
import QrCodePreview from './qr-code-preview';
import StackedButtonsPreview, { getStackedSdkSrc } from './stacked-buttons-preview';
import { hasVariantPricing } from './variant-builder';

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
 * @param {string} props.linkText             - The link label, empty for the default.
 * @param {string} props.paymentLink          - PayPal payment URL, once one has been issued.
 * @param {string} props.partnerAttributionId - PayPal partner attribution (BN) code.
 * @param {object} props.attributes           - The block attributes, for the style mapping.
 * @return {Element} Link preview element.
 */
function LinkPreview( { linkText, paymentLink, partnerAttributionId, attributes = {} } ) {
	// Mirrors render_api_managed_button()'s LINK branch: an empty label falls
	// back to the default rather than drawing a bare anchor.
	const label = `${ linkText ?? '' }`.trim() || DEFAULT_LABEL;

	return (
		<div className="jetpack-paypal-button-preview jetpack-paypal-button-preview--link">
			{ /* A real anchor, so the theme styles it the way it styles the published one. */ }
			<a
				href={ withPartnerAttribution( paymentLink, partnerAttributionId ) }
				className="jetpack-paypal-button__paypal-link"
				style={ getTextStyle( attributes.linkColor, attributes.linkFontSize ) }
				onClick={ event => event.preventDefault() }
			>
				{ label }
			</a>
		</div>
	);
}

/**
 * The QR format — the code and its caption.
 *
 * Copy and Download belong to the frontend and the inspector, so the canvas
 * draws the code on its own.
 *
 * @param {object}  props                      - Component props.
 * @param {boolean} props.qrShowCaption        - Whether to draw the caption under the code. Off by default, matching render_api_managed_button().
 * @param {string}  props.qrCaption            - Caption text, empty for the default.
 * @param {string}  props.paymentLink          - PayPal payment URL, once one has been issued.
 * @param {string}  props.partnerAttributionId - PayPal partner attribution (BN) code.
 * @param {object}  props.attributes           - The block attributes, for the style mapping.
 * @return {Element} QR preview element.
 */
function QrPreview( {
	qrShowCaption = false,
	qrCaption,
	paymentLink,
	partnerAttributionId,
	attributes = {},
} ) {
	// Encode the attributed URL, so the editor's code and the frontend's send a
	// buyer through the same link.
	const qrUrl = withPartnerAttribution( paymentLink, partnerAttributionId );

	return (
		<div
			className="jetpack-paypal-button jetpack-paypal-button-preview jetpack-paypal-button-preview--qr"
			style={ getMarginStyle( attributes ) }
		>
			<QrCodePreview
				url={ qrUrl }
				className="jetpack-paypal-button__qr-canvas"
				frameStyle={ getWidthAndBorderStyle( attributes ) }
				showCaption={ qrShowCaption }
				caption={ qrCaption }
				captionStyle={ getTextStyle( attributes.captionColor, attributes.captionFontSize ) }
			/>
		</div>
	);
}

/**
 * The BUTTON format — the product card and a theme-native checkout button — and
 * the CHECKOUT format, which swaps the button for a stand-in for PayPal's own.
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
 * @param {object}  props.attributes         - The block attributes, for the style mapping.
 * @param {boolean} props.inlineCheckout     - Whether the buyer picks options and pays on the page.
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
	attributes = {},
	inlineCheckout = false,
} ) {
	// An empty currencyCode attribute arrives as '', which the destructure
	// default above lets through, so it needs a fallback of its own.
	const code = currencyCode || 'USD';
	// Mirrors render_api_managed_button(): PayPal drops the product-level amount
	// once the options have their own prices, but the block keeps what was typed.
	// Prices stay strings, because PayPal accepts 0 and the empty test is ''.
	const productPrice = hasVariantPricing( variantsEnabled, variants )
		? ''
		: `${ price ?? '' }`.trim();
	const headlinePrice = linkPrice( { price, currencyCode: code, variantsEnabled, variants } );
	// Trimmed, as render_api_managed_button() does. The card needs a name,
	// description or price. The image is outside it.
	const name = `${ productName ?? '' }`.trim();
	const description = `${ productDescription ?? '' }`.trim();
	const hasProduct = name !== '' || description !== '' || headlinePrice !== '';
	const variantGroups = variantsEnabled ? getVariantGroups( variants, productPrice ) : [];
	// A blank label would draw an unreadable button, so fall back to the same
	// default render_api_managed_button() uses.
	const label = `${ buttonText ?? '' }`.trim() || DEFAULT_LABEL;
	// The quantity field the frontend draws, when the payment allows more than one.
	const maxQuantity = attributes.adjustableQuantity
		? parseInt( attributes.maxQuantity, 10 ) || 1
		: 1;
	const fieldId = useInstanceId( ButtonPreview, 'jetpack-paypal-checkout-preview' );

	return (
		<div
			className={ clsx( 'jetpack-paypal-button', 'jetpack-paypal-button-preview', {
				'jetpack-paypal-button--checkout-format': inlineCheckout,
			} ) }
			style={ getWidthStyle( attributes ) }
		>
			{ /* Product image */ }
			{ imageUrl && (
				<div className="jetpack-paypal-button__product-image">
					<img src={ imageUrl } alt={ name } />
				</div>
			) }

			{ /* Product card — the frontend's markup and class names. */ }
			{ hasProduct && (
				<div className="jetpack-paypal-button__product">
					<div className="jetpack-paypal-button__product-info">
						{ name !== '' && <span className="jetpack-paypal-button__product-name">{ name }</span> }
						{ description !== '' && (
							<span className="jetpack-paypal-button__product-description">{ description }</span>
						) }
					</div>
					{ headlinePrice !== '' && (
						<span className="jetpack-paypal-button__product-price">{ headlinePrice }</span>
					) }
				</div>
			) }

			{ /* On-page checkout: the options as selects and a quantity field, as the
			     frontend draws them. Inert, since nothing is bought in the editor. */ }
			{ inlineCheckout && variantGroups.length > 0 && (
				<div className="jetpack-paypal-button__variants">
					{ variantGroups.map( ( group, i ) => (
						<label
							key={ i }
							htmlFor={ `${ fieldId }-option-${ i }` }
							className="jetpack-paypal-button__variant-group jetpack-paypal-button__variant-group--select"
						>
							<span className="jetpack-paypal-button__variant-name">{ group.name }</span>
							<select
								id={ `${ fieldId }-option-${ i }` }
								className="jetpack-paypal-button__variant-select"
								disabled
							>
								{ group.options.map( ( option, j ) => (
									<option key={ j } value={ option.label }>
										{ option.price
											? `${ option.label } (${ formatPrice( option.price, code ) })`
											: option.label }
									</option>
								) ) }
							</select>
						</label>
					) ) }
				</div>
			) }
			{ inlineCheckout && maxQuantity > 1 && (
				<label htmlFor={ `${ fieldId }-quantity` } className="jetpack-paypal-button__quantity">
					<span className="jetpack-paypal-button__quantity-label">
						{ __( 'Quantity', 'jetpack-paypal-payments' ) }
					</span>
					<input
						id={ `${ fieldId }-quantity` }
						type="number"
						className="jetpack-paypal-button__quantity-input"
						value="1"
						min="1"
						max={ maxQuantity }
						readOnly
						disabled
					/>
				</label>
			) }

			{ /* Variant summary — the frontend's markup and class names, so both sides look alike. */ }
			{ ! inlineCheckout && variantGroups.length > 0 && (
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
												{ formatPrice( option.price, code ) }
											</span>
										</>
									) }
								</span>
							) ) }
						</div>
					) ) }
				</div>
			) }

			{ /* PayPal draws the real buttons from its SDK; the canvas shows stand-ins in
			     PayPal's colors, so the merchant sees the shape without a live client id. */ }
			{ inlineCheckout && (
				<div
					className="jetpack-paypal-button__buttons jetpack-paypal-button-preview__paypal-buttons"
					aria-hidden="true"
				>
					<div className="jetpack-paypal-button-preview__paypal-button jetpack-paypal-button-preview__paypal-button--paypal">
						<span className="jetpack-paypal-button__logo">PayPal</span>
					</div>
					<div className="jetpack-paypal-button-preview__paypal-button jetpack-paypal-button-preview__paypal-button--card">
						{ __( 'Debit or Credit Card', 'jetpack-paypal-payments' ) }
					</div>
				</div>
			) }

			{ /* Checkout button preview — theme-native unless the Styles tab says
			     otherwise, labeled with the buttonText attribute. */ }
			{ ! inlineCheckout && (
				<div className="jetpack-paypal-button__buttons">
					<div
						className={ clsx(
							'jetpack-paypal-button__checkout-link',
							'jetpack-paypal-button-preview__checkout-button',
							'wp-element-button',
							{ 'is-style-outline': isOutlineButton( attributes ) }
						) }
						style={ getButtonStyle( attributes ) }
						aria-hidden="true"
					>
						<span className="jetpack-paypal-button__button-text">{ label }</span>
					</div>
				</div>
			) }

			{ ! inlineCheckout && attributes.buttonShowPoweredBy && (
				<p className="jetpack-paypal-button__attribution">
					{ createInterpolateElement(
						sprintf(
							/* translators: %s: the PayPal wordmark */
							__( 'Powered by %s', 'jetpack-paypal-payments' ),
							'<logo />'
						),
						{ logo: <span className="jetpack-paypal-button__logo">PayPal</span> }
					) }
				</p>
			) }
		</div>
	);
}

/**
 * The block's canvas preview, by Display Format.
 *
 * @param {object} props        - Component props. The rest go to the format's own preview.
 * @param {string} props.format - Display format: BUTTON, CHECKOUT, LINK, QR or STACKED.
 * @return {Element} The preview for that format.
 */
export default function PayPalButtonPreview( { format, ...props } ) {
	// Render again when a save ends, so the stacked key below reads the new card revision.
	useSelect( select => select( editorStore ).isSavingPost(), [] );

	// An unknown format falls back to the button, the same way
	// render_api_managed_button() validates it server-side.
	switch ( format ) {
		case 'LINK':
			return <LinkPreview { ...props } />;
		case 'QR':
			return <QrPreview { ...props } />;
		case 'CHECKOUT':
			return <ButtonPreview { ...props } inlineCheckout />;
		case 'STACKED':
			// The SDK boots once per mount, so the key remounts this on a new URL, payment or card revision.
			return (
				<StackedButtonsPreview
					key={ `${ getStackedSdkSrc( props.attributes, props.resource ) }|${ props.attributes?.resourceId }|${ getCardRevision( props.attributes?.resourceId ) }` }
					{ ...props }
				/>
			);
		default:
			return <ButtonPreview { ...props } />;
	}
}
