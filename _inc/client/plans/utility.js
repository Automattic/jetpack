/**
 * External dependencies
 */
import { _x } from '@wordpress/i18n';

export function getBillingTimeFrameString( billingTimeFrame ) {
	if ( 'yearly' === billingTimeFrame ) {
		return _x( 'per year', 'Duration of product subscription timeframe.', 'jetpack' );
	}

	if ( 'monthly' === billingTimeFrame ) {
		return _x( 'per month', 'Duration of product subscription timeframe.', 'jetpack' );
	}

	return '';
}
