/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — The first step of a new block: reuse a link or create one.
 *
 * @package
 */

import { Button, PanelBody, SearchControl, Spinner } from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { CURRENCY_SYMBOLS } from '../utils/currency-symbols';

/**
 * Lists longer than this get a search box.
 */
export const SEARCH_THRESHOLD = 10;

/**
 * The price a payment link charges, as text.
 *
 * A link priced per option has no product price; the lowest option price
 * stands in for it.
 *
 * @param {object} resource - A payment resource from the list route.
 * @return {string} The formatted price, or an empty string when the link has none.
 */
export function linkPrice( resource ) {
	const item = resource?.line_items?.[ 0 ];
	if ( ! item ) {
		return '';
	}

	const amounts = [];
	if ( item.unit_amount?.value ) {
		amounts.push( item.unit_amount );
	}
	( item.variants?.dimensions || [] ).forEach( dim =>
		( dim.options || [] ).forEach( opt => {
			if ( opt.unit_amount?.value ) {
				amounts.push( opt.unit_amount );
			}
		} )
	);
	if ( ! amounts.length ) {
		return '';
	}

	const lowest = amounts.reduce( ( min, amount ) =>
		parseFloat( amount.value ) < parseFloat( min.value ) ? amount : min
	);
	const symbol = CURRENCY_SYMBOLS[ lowest.currency_code ] || `${ lowest.currency_code } `;
	const price = `${ symbol }${ lowest.value }`;

	return item.unit_amount?.value
		? price
		: sprintf(
				/* translators: %s: the lowest option price of a payment link */
				__( 'From %s', 'jetpack-paypal-payments' ),
				price
		  );
}

/**
 * The day a payment link was created, in the browser's locale.
 *
 * @param {object} resource - A payment resource from the list route.
 * @return {string} The date, or an empty string when the link has none.
 */
export function linkDate( resource ) {
	const time = resource?.create_time ? new Date( resource.create_time ) : null;
	if ( ! time || Number.isNaN( time.getTime() ) ) {
		return '';
	}
	return time.toLocaleDateString( undefined, { year: 'numeric', month: 'short', day: 'numeric' } );
}

/**
 * The links whose name, description or price contain the search text.
 *
 * @param {Array}  links  - Payment resources.
 * @param {string} search - What the merchant typed.
 * @return {Array} The matching resources, every one when the search is blank.
 */
export function filterLinks( links, search ) {
	const needle = search.trim().toLowerCase();
	if ( ! needle ) {
		return links;
	}
	return links.filter( link => {
		const item = link?.line_items?.[ 0 ] || {};
		return [ item.name, item.description, linkPrice( link ) ].some( text =>
			( text || '' ).toLowerCase().includes( needle )
		);
	} );
}

/**
 * The sidebar step that offers the account's existing links before the form.
 *
 * @param {object}   props             - Component props.
 * @param {Array}    props.links       - Payment resources from the list route.
 * @param {Function} props.onCreateNew - Go on to the empty form.
 * @param {Function} props.onPick      - Reuse one link; receives the resource.
 * @param {boolean}  props.isPicking   - Whether a picked link is being read back.
 * @return {Element} The step.
 */
export default function ExistingLinksStep( { links, onCreateNew, onPick, isPicking } ) {
	const [ search, setSearch ] = useState( '' );
	const shown = useMemo( () => filterLinks( links, search ), [ links, search ] );

	return (
		<PanelBody title={ __( 'Payment link', 'jetpack-paypal-payments' ) } initialOpen={ true }>
			<p className="jetpack-paypal-payment-buttons__links-intro">
				{ __(
					'Create a new payment link for this block, or reuse one you already have.',
					'jetpack-paypal-payments'
				) }
			</p>
			<Button
				variant="primary"
				onClick={ onCreateNew }
				disabled={ isPicking }
				className="jetpack-paypal-payment-buttons__links-create"
			>
				{ __( 'Create new', 'jetpack-paypal-payments' ) }
			</Button>
			{ links.length > SEARCH_THRESHOLD && (
				<SearchControl
					label={ __( 'Search payment links', 'jetpack-paypal-payments' ) }
					placeholder={ __( 'Search by name, description or price', 'jetpack-paypal-payments' ) }
					value={ search }
					onChange={ setSearch }
					__nextHasNoMarginBottom
				/>
			) }
			{ isPicking && <Spinner /> }
			<ul className="jetpack-paypal-payment-buttons__links" aria-busy={ isPicking }>
				{ shown.map( link => (
					<li key={ link.id }>
						<Button
							variant="tertiary"
							className="jetpack-paypal-payment-buttons__link"
							onClick={ () => onPick( link ) }
							disabled={ isPicking }
						>
							<span className="jetpack-paypal-payment-buttons__link-name">
								{ link.line_items?.[ 0 ]?.name || link.id }
							</span>
							<span className="jetpack-paypal-payment-buttons__link-meta">
								{ [ linkPrice( link ), linkDate( link ) ].filter( Boolean ).join( ' · ' ) }
							</span>
						</Button>
					</li>
				) ) }
			</ul>
			{ shown.length === 0 && (
				<p className="jetpack-paypal-payment-buttons__links-empty">
					{ __( 'No payment links match your search.', 'jetpack-paypal-payments' ) }
				</p>
			) }
		</PanelBody>
	);
}
