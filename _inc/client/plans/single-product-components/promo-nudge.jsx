/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import './promo-nudge.scss';

export default function PromoNudge( { percent } ) {
	const discountPercent = percent ? percent : 70;
	return (
		<div className="single-product-backup__promo">
			<div className="single-product-backup__promo-star">
				{ __( 'Up to %(percent)d%% off!', { args: { percent: discountPercent } } ) }
			</div>
			<h4 className="single-product-backup__promo-header">
				{ __( 'Hurry, these are {{s}}Limited time introductory prices!{{/s}}', {
					components: {
						s: <strong />,
					},
				} ) }
			</h4>
		</div>
	);
}
