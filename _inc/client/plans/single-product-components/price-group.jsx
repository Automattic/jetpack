/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import PlanPrice from 'components/plans/plan-price';
import { getBillingTimeFrameString } from '../utility';

export default function PriceGroup( {
	billingTimeFrame,
	currencyCode,
	discountedPrice,
	fullPrice,
} ) {
	return (
		<div className="single-product-backup__price-group">
			{ !! discountedPrice ? (
				<React.Fragment>
					<PlanPrice currencyCode={ currencyCode } rawPrice={ fullPrice } original />
					<PlanPrice currencyCode={ currencyCode } rawPrice={ discountedPrice } discounted />
				</React.Fragment>
			) : (
				<PlanPrice currencyCode={ currencyCode } rawPrice={ fullPrice } />
			) }
			<div className="single-product-backup__price-group-billing-timeframe">
				{ getBillingTimeFrameString( billingTimeFrame ) }
			</div>
		</div>
	);
}
