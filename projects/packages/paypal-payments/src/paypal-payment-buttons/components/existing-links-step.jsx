/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — The account's existing links, offered to a new block or
 * to a saved one switching links.
 *
 * @package
 */

import { Button, PanelBody, SearchControl, Spinner } from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { linkDate } from '../utils/link-date';
import { resourcePrice } from '../utils/link-price';

/**
 * Lists longer than this get a search box.
 */
export const SEARCH_THRESHOLD = 10;

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
		return [ item.name, item.description, resourcePrice( link ) ].some( text =>
			( text || '' ).toLowerCase().includes( needle )
		);
	} );
}

// The comments sit on the calls, where the minifier keeps them with the string.
const titleReuse =
	/* translators: %d: number of payment links the account already has */
	__( 'Or reuse an existing link (%d)', 'jetpack-paypal-payments' );
const titleSwitch =
	/* translators: %d: number of payment links the block can switch to */
	__( 'Other payment links (%d)', 'jetpack-paypal-payments' );
const emptyNoMatch = __( 'No payment links match your search.', 'jetpack-paypal-payments' );
const emptyNoOther = __( 'No other payment links available.', 'jetpack-paypal-payments' );

/**
 * The sidebar step that offers the account's existing links.
 *
 * With onCreateNew it is a new block's first step, before the form. Without it,
 * it is a saved block switching to another of the account's links.
 *
 * @param {object}   props               - Component props.
 * @param {Array}    props.links         - Payment resources from the list route.
 * @param {boolean}  props.isLoading     - Whether the list is still being read.
 * @param {Function} [props.onCreateNew] - Go on to the empty form.
 * @param {Function} props.onPick        - Reuse one link; receives the resource.
 * @param {boolean}  props.isPicking     - Whether a picked link is being read back.
 * @return {Element} The step.
 */
export default function ExistingLinksStep( { links, isLoading, onCreateNew, onPick, isPicking } ) {
	const [ search, setSearch ] = useState( '' );
	const shown = useMemo( () => filterLinks( links, search ), [ links, search ] );
	const isSwitch = ! onCreateNew;

	if ( isLoading ) {
		return (
			<PanelBody title={ __( 'Payment link', 'jetpack-paypal-payments' ) } initialOpen={ true }>
				<Spinner />
			</PanelBody>
		);
	}

	return (
		<PanelBody title={ __( 'Payment link', 'jetpack-paypal-payments' ) } initialOpen={ true }>
			{ ! isSwitch && (
				<>
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
				</>
			) }
			{ /* The section's divider separates the list from Create new, so it goes with it. */ }
			<div className={ isSwitch ? undefined : 'jetpack-paypal-payment-buttons__links-section' }>
				<h3 className="jetpack-paypal-payment-buttons__links-title">
					{ isSwitch ? sprintf( titleSwitch, links.length ) : sprintf( titleReuse, links.length ) }
				</h3>
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
						<li key={ link.id } className="jetpack-paypal-payment-buttons__links-item">
							<Button
								className="jetpack-paypal-payment-buttons__link"
								onClick={ () => onPick( link ) }
								disabled={ isPicking }
							>
								<span className="jetpack-paypal-payment-buttons__link-row">
									<span className="jetpack-paypal-payment-buttons__link-name">
										{ link.line_items?.[ 0 ]?.name || link.id }
									</span>
									<span className="jetpack-paypal-payment-buttons__link-price">
										{ resourcePrice( link ) }
									</span>
								</span>
								<span className="jetpack-paypal-payment-buttons__link-date">
									{ linkDate( link ) }
								</span>
							</Button>
						</li>
					) ) }
				</ul>
				{ shown.length === 0 && (
					<p className="jetpack-paypal-payment-buttons__links-empty">
						{ links.length === 0 ? emptyNoOther : emptyNoMatch }
					</p>
				) }
			</div>
		</PanelBody>
	);
}
