/**
 * External dependencies
 */
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { translate as __, numberFormat } from 'i18n-calypso';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import {
	JETPACK_SEARCH_TIER_UP_TO_100_RECORDS,
	JETPACK_SEARCH_TIER_UP_TO_1K_RECORDS,
	JETPACK_SEARCH_TIER_UP_TO_10K_RECORDS,
	JETPACK_SEARCH_TIER_UP_TO_100K_RECORDS,
	JETPACK_SEARCH_TIER_UP_TO_1M_RECORDS,
	JETPACK_SEARCH_TIER_MORE_THAN_1M_RECORDS,
} from 'lib/plans/constants';
import { getUpgradeUrl } from 'state/initial-state';
import { SEARCH_DESCRIPTION, SEARCH_TITLE } from '../constants';
import PlanRadioButton from '../single-product-components/plan-radio-button';
import ProductSavings from '../single-product-components/product-savings';

function getTierLabel( priceTierSlug, recordCount ) {
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
		case JETPACK_SEARCH_TIER_MORE_THAN_1M_RECORDS:
			const tierMaximumRecords = 1000000 * Math.ceil( recordCount / 1000000 );
			return __( 'Up to %(tierMaximumRecords)s records', {
				args: { tierMaximumRecords: numberFormat( tierMaximumRecords ) },
			} );
		default:
			return null;
	}
}

function handleSelectedTimeframeChangeFactory( setTimeframe ) {
	return event => setTimeframe( event.target.value );
}

export function SingleProductSearchCard( props ) {
	const [ timeframe, setTimeframe ] = useState( 'yearly' );
	const handleSelectedTimeframeChange = handleSelectedTimeframeChangeFactory( setTimeframe );
	const currencyCode = get( props.siteProducts, 'jetpack_search.currency_code', '' );
	const monthlyPrice = get( props.siteProducts, 'jetpack_search_monthly.cost', '' );
	const yearlyPrice = get( props.siteProducts, 'jetpack_search.cost', '' );
	const recordCount = get( props.siteProducts, 'jetpack_search.price_tier_usage_quantity', '0' );

	return props.isFetching ? (
		<div className="plans-section__single-product-skeleton is-placeholder" />
	) : (
		<div className="single-product__accented-card dops-card">
			<div className="single-product__accented-card-header">
				<h3 className="single-product-backup__header-title">{ SEARCH_TITLE }</h3>
			</div>
			<div className="single-product__accented-card-body">
				<p>
					{ SEARCH_DESCRIPTION }
					<a href="https://jetpack.com/search" target="_blank" rel="noopener noreferrer">
						{ __( 'Learn More' ) }
					</a>
				</p>
				<h4 className="single-product-backup__options-header">
					{ __( 'Eligible Tier: ' ) }
					{ getTierLabel(
						get( props.siteProducts, 'jetpack_search.price_tier_slug' ),
						recordCount
					) }
					<br />
					{ __(
						'Your current site record size: %s record',
						'Your current site record size: %s records',
						{ args: recordCount, count: recordCount }
					) }
				</h4>
				<div className="single-product-search__radio-buttons-container">
					<PlanRadioButton
						billingTimeFrame="monthly"
						checked={ timeframe === 'monthly' }
						currencyCode={ currencyCode }
						fullPrice={ monthlyPrice }
						onChange={ handleSelectedTimeframeChange }
						planName="Monthly"
						radioValue="monthly"
					/>
					<PlanRadioButton
						billingTimeFrame="yearly"
						checked={ timeframe === 'yearly' }
						currencyCode={ currencyCode }
						fullPrice={ yearlyPrice }
						onChange={ handleSelectedTimeframeChange }
						planName="Annual"
						radioValue="yearly"
					/>
				</div>
				<ProductSavings
					billingTimeframe={ timeframe }
					currencyCode={ currencyCode }
					potentialSavings={ 12 * monthlyPrice - yearlyPrice }
				/>
				<div className="single-product-search__upgrade-button-container">
					<Button
						href={ timeframe === 'yearly' ? props.searchUpgradeUrl : props.searchUpgradeMonthlyUrl }
						primary
					>
						{ __( 'Upgrade to Jetpack Search' ) }
					</Button>
				</div>
			</div>
		</div>
	);
}

export default connect( state => ( {
	searchUpgradeUrl: getUpgradeUrl( state, 'jetpack-search' ),
	searchUpgradeMonthlyUrl: getUpgradeUrl( state, 'jetpack-search-monthly' ),
} ) )( SingleProductSearchCard );
