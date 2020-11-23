/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './promo-nudge.scss';

export default function PromoNudge( { percent } ) {
	const discountPercent = percent ? percent : 70;
	return (
		<div className="single-product-backup__promo">
			<div className="single-product-backup__promo-star">
				{ sprintf( __( 'Up to %d%% off!', 'jetpack' ), discountPercent ) }
			</div>
			<h4 className="single-product-backup__promo-header">
				{ createInterpolateElement(
					__( 'Hurry, these are <s>Limited time introductory prices!</s>', 'jetpack' ),
					{
						s: <strong />,
					}
				) }
			</h4>
		</div>
	);
}
