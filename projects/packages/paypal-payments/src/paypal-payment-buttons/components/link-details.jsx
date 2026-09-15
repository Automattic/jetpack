/**
 * PayPal Payment Buttons — The link details view, the sidebar's default for a saved link.
 *
 * @package
 */

import { DropdownMenu } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { moreVertical, pencil } from '@wordpress/icons';
import { formatPrice } from '../utils/currency-symbols';
import { linkDate } from '../utils/link-date';
import { getLowestVariantPrice, hasVariantPricing } from './variant-builder';

/**
 * The price a block charges, as text.
 *
 * A block priced per option has no product price; the lowest option price
 * stands in for it.
 *
 * @param {object}  attributes                 - Block attributes.
 * @param {string}  attributes.price           - The product price.
 * @param {string}  attributes.currencyCode    - The ISO currency code.
 * @param {boolean} attributes.variantsEnabled - Whether product options are on.
 * @param {object}  attributes.variants        - The option groups.
 * @return {string} The formatted price, or an empty string when there is none.
 */
export function attributesPrice( { price, currencyCode, variantsEnabled, variants } ) {
	const code = currencyCode || 'USD';

	if ( ! hasVariantPricing( variantsEnabled, variants ) ) {
		return `${ price ?? '' }`.trim() === '' ? '' : formatPrice( price, code );
	}

	const lowest = getLowestVariantPrice( variants );
	if ( lowest === null ) {
		return '';
	}
	return sprintf(
		/* translators: %s: formatted price, e.g. "$29.99" */
		__( 'From %s', 'jetpack-paypal-payments' ),
		formatPrice( lowest, code )
	);
}

/**
 * What the sidebar shows for a saved link: its name and price, then when it
 * was made, its id and where it is used. Edit is in the menu beside the name.
 *
 * @param {object}      props            - Component props.
 * @param {object}      props.attributes - Block attributes.
 * @param {object|null} props.resource   - The payment as last read from PayPal, null until then.
 * @param {Function}    props.onEdit     - Open the form.
 * @return {Element} The view.
 */
export default function LinkDetails( { attributes, resource, onEdit } ) {
	const { productName, resourceId, adjustableQuantity, maxQuantity } = attributes;
	const price = attributesPrice( attributes );
	// Shown until the payment has been read back, or when it could not be.
	const unknown = '—';

	let usedOn = unknown;
	if ( typeof resource?.embeds === 'number' ) {
		usedOn = sprintf(
			/* translators: %d: number of published posts embedding the payment link */
			_n( '%d published post', '%d published posts', resource.embeds, 'jetpack-paypal-payments' ),
			resource.embeds
		);
	}

	const rows = [
		[ __( 'Created:', 'jetpack-paypal-payments' ), linkDate( resource ) || unknown ],
		[ __( 'Hosted ID:', 'jetpack-paypal-payments' ), <code key="id">{ resourceId }</code> ],
		[ __( 'Link used on:', 'jetpack-paypal-payments' ), usedOn ],
	];
	if ( adjustableQuantity ) {
		rows.push( [ __( 'Max quantity:', 'jetpack-paypal-payments' ), maxQuantity ] );
	}

	return (
		<div className="jetpack-paypal-payment-buttons__details">
			<div className="jetpack-paypal-payment-buttons__details-header">
				<h2 className="jetpack-paypal-payment-buttons__details-title">
					{ productName || resourceId }
				</h2>
				<DropdownMenu
					icon={ moreVertical }
					label={ __( 'Payment link options', 'jetpack-paypal-payments' ) }
					controls={ [
						{
							title: __( 'Edit', 'jetpack-paypal-payments' ),
							icon: pencil,
							onClick: onEdit,
						},
					] }
				/>
			</div>
			{ price && <p className="jetpack-paypal-payment-buttons__details-price">{ price }</p> }
			<hr className="jetpack-paypal-payment-buttons__details-separator" />
			<dl className="jetpack-paypal-payment-buttons__details-list">
				{ rows.map( ( [ label, value ] ) => (
					<Fragment key={ label }>
						<dt>{ label }</dt>
						<dd>{ value }</dd>
					</Fragment>
				) ) }
			</dl>
		</div>
	);
}
