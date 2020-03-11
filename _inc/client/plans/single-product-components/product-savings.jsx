/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import PlanPrice from 'components/plans/plan-price';

export default function ProductSavings( { selectedBackup, currencyCode } ) {
	if ( ! selectedBackup || ! selectedBackup.potentialSavings ) {
		return null;
	}
	const savings = (
		<PlanPrice
			className="single-product-backup__annual-savings"
			rawPrice={ selectedBackup.potentialSavings }
			currencyCode={ currencyCode }
			inline
		/>
	);

	return (
		<p className="single-product-backup__savings">
			{ __( 'You are saving {{savings /}} by paying yearly', { components: { savings } } ) }
		</p>
	);
}
