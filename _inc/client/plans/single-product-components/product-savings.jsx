/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
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
				? createInterpolateElement(
						/* translators: placeholder is an amount of money. */
						__( 'You would save <savings /> by paying yearly', 'jetpack' ),
						{
							savings,
						}
				  )
				: createInterpolateElement(
						/* translators: placeholder is an amount of money. */
						__( 'You are saving <savings /> by paying yearly', 'jetpack' ),
						{
							savings,
						}
				  ) }
		</p>
	);
}
