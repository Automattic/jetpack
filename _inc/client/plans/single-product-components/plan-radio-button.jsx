/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';
/**
 * Internal dependencies
 */
import PriceGroup from './price-group';
import './plan-radio-button.scss';

import { numberFormat, translate as __ } from 'i18n-calypso';

import {
	JETPACK_SEARCH_TIER_MORE_THAN_1M_RECORDS,
	JETPACK_SEARCH_TIER_UP_TO_100_RECORDS,
	JETPACK_SEARCH_TIER_UP_TO_100K_RECORDS,
	JETPACK_SEARCH_TIER_UP_TO_10K_RECORDS,
	JETPACK_SEARCH_TIER_UP_TO_1K_RECORDS,
	JETPACK_SEARCH_TIER_UP_TO_1M_RECORDS,
} from 'lib/plans/constants';

function getSearchTierLabel( priceTierSlug, recordCount ) {
	switch ( priceTierSlug ) {
		case JETPACK_SEARCH_TIER_UP_TO_100_RECORDS:
			return __( 'Up to 100 records' );
		case JETPACK_SEARCH_TIER_UP_TO_1K_RECORDS:
			return __( 'Up to 1,000 records' );
		case JETPACK_SEARCH_TIER_UP_TO_10K_RECORDS:
			return __( 'Up to 10,000 records' );
		case JETPACK_SEARCH_TIER_UP_TO_100K_RECORDS:
			return __( 'Up to 100,000 records' );
		case JETPACK_SEARCH_TIER_UP_TO_1M_RECORDS:
			return __( 'Up to 1,000,000 records' );
		case JETPACK_SEARCH_TIER_MORE_THAN_1M_RECORDS: {
			const tierMaximumRecords = 1000000 * Math.ceil( recordCount / 1000000 );
			return __( 'Up to %(tierMaximumRecords)s records', {
				args: { tierMaximumRecords: numberFormat( tierMaximumRecords ) },
			} );
		}
		default:
			return null;
	}
}

export default function PlanRadioButton( props ) {
	const classes = classNames( 'plan-radio-button', { 'is-selected': props.checked } );
	const label =
		props.product && 'search' === props.product.key
			? getSearchTierLabel( props.product.priceTierSlug, props.product.recordCount )
			: props.planName;

	return (
		<label className={ classes }>
			<input
				type="radio"
				className="plan-radio-button__input"
				value={ props.radioValue }
				checked={ props.checked }
				onChange={ props.onChange ? props.onChange : null }
			/>
			<div className="plan-radio-button__label">
				<span className="plan-radio-button__title">{ label }</span>
				<PriceGroup
					billingTimeFrame={ props.billingTimeFrame }
					currencyCode={ props.currencyCode }
					discountedPrice={ props.discountedPrice }
					fullPrice={ props.fullPrice }
				/>
			</div>
		</label>
	);
}
