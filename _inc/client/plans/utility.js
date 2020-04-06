/**
 * External dependencies
 */
import { translate as __ } from 'i18n-calypso';

export function getBillingTimeFrameString( billingTimeFrame ) {
	if ( 'yearly' === billingTimeFrame ) {
		return __( 'per year', {
			comment: 'Duration of product subscription timeframe.',
		} );
	}

	if ( 'monthly' === billingTimeFrame ) {
		return __( 'per month', {
			comment: 'Duration of product subscription timeframe.',
		} );
	}

	return '';
}
