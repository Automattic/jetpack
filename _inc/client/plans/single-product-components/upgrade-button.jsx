/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import PlanPrice from 'components/plans/plan-price';
import { getBillingTimeFrameString } from '../utility';

export default function UpgradeButton( {
	selectedUpgrade,
	billingTimeFrame,
	currencyCode,
	onClickHandler,
} ) {
	if ( ! selectedUpgrade ) {
		return null;
	}
	const { link, name, fullPrice, discountedPrice, type } = selectedUpgrade;
	const price = (
		<PlanPrice currencyCode={ currencyCode } rawPrice={ discountedPrice || fullPrice } inline />
	);

	return (
		<div className="single-product-backup__upgrade-button-container">
			<Button href={ link } onClick={ onClickHandler( type ) } primary>
				{ __( 'Upgrade to %(name)s for {{price/}} %(billingTimeFrame)s', {
					components: { price },
					args: { name, billingTimeFrame: getBillingTimeFrameString( billingTimeFrame ) },
					comment:
						'Button to purchase product upgrade. %(name)s is the product name, {{price /}} can be a range of prices, and %(billingTimeFrame)s is the billing period for the product upgrade.',
				} ) }
			</Button>
		</div>
	);
}
