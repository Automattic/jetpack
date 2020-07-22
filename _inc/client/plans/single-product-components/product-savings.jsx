/**
 * External dependencies
 */
import React from 'react';
import { jetpackCreateInterpolateElement } from 'components/create-interpolate-element';
import { __ } from '@wordpress/i18n';

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
				? jetpackCreateInterpolateElement(
						/* translators: placeholder is an amount of money. */
						__( 'You would save <savings /> by paying yearly', 'jetpack' ),
						{
							savings,
						}
				  )
				: jetpackCreateInterpolateElement(
						/* translators: placeholder is an amount of money. */
						__( 'You are saving <savings /> by paying yearly', 'jetpack' ),
						{
							savings,
						}
				  ) }
		</p>
	);
}
