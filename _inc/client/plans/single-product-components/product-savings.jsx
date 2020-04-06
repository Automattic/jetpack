/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import PlanPrice from 'components/plans/plan-price';
import './product-savings.scss';

export default function ProductSavings( {
	billingTimeframe = 'yearly',
	potentialSavings,
	currencyCode,
} ) {
	if ( ! potentialSavings ) {
		return null;
	}
	const savings = (
		<PlanPrice
			className="single-product__annual-savings"
			rawPrice={ potentialSavings }
			currencyCode={ currencyCode }
			inline
		/>
	);

	return (
		<p className="single-product__savings">
			{ billingTimeframe === 'monthly'
				? __( 'You would save {{savings /}} by paying yearly', { components: { savings } } )
				: __( 'You are saving {{savings /}} by paying yearly', { components: { savings } } ) }
		</p>
	);
}
