/**
 * External dependencies
 */
import React from 'react';
import { translate as __, numberFormat } from 'i18n-calypso';
import { get, noop } from 'lodash';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import PlanRadioButton from '../single-product-components/plan-radio-button';
import {
	JETPACK_SEARCH_TIER_UP_TO_100_RECORDS,
	JETPACK_SEARCH_TIER_UP_TO_1K_RECORDS,
	JETPACK_SEARCH_TIER_UP_TO_10K_RECORDS,
	JETPACK_SEARCH_TIER_UP_TO_100K_RECORDS,
	JETPACK_SEARCH_TIER_UP_TO_1M_RECORDS,
	JETPACK_SEARCH_TIER_MORE_THAN_1M_RECORDS,
} from '../../lib/plans/constants';

function getTierLabel( priceTierSlug, recordCount ) {
	switch ( priceTierSlug ) {
		case JETPACK_SEARCH_TIER_UP_TO_100_RECORDS:
			return __( 'Tier 1: Up to 100 records' );
		case JETPACK_SEARCH_TIER_UP_TO_1K_RECORDS:
			return __( 'Tier 2: Up to 1,000 records' );
		case JETPACK_SEARCH_TIER_UP_TO_10K_RECORDS:
			return __( 'Tier 3: Up to 10,000 records' );
		case JETPACK_SEARCH_TIER_UP_TO_100K_RECORDS:
			return __( 'Tier 4: Up to 100,000 records' );
		case JETPACK_SEARCH_TIER_UP_TO_1M_RECORDS:
			return __( 'Tier 5: Up to 1,000,000 records' );
		case JETPACK_SEARCH_TIER_MORE_THAN_1M_RECORDS:
			// NOTE: 5 === number of defined tiers
			const tierNumber = 5 + Math.floor( recordCount / 1000000 );
			const tierMaximumRecords = 1000000 * Math.ceil( recordCount / 1000000 );
			return __( 'Tier %(tierNumber)d: Up to %(tierMaximumRecords)s records', {
				args: { tierNumber, tierMaximumRecords: numberFormat( tierMaximumRecords ) },
			} );
		default:
			return null;
	}
}

const BILLING_TIMEFRAME = 'yearly';

export default function SingleProductSearchCard( props ) {
	const currencyCode = get( props.products, 'jetpack_search.currency_code', '' );
	const yearlyPrice = get( props.products, 'jetpack_search.cost', '' );
	const recordCount = get( props.siteProducts, 'jetpack_search.price_tier_usage_quantity', '0' );

	return props.isFetching ? (
		<div className="plans-section__single-product-skeleton is-placeholder" />
	) : (
		<div className="single-product__accented-card dops-card">
			<div className="single-product__accented-card-header">
				<h3 className="single-product-backup__header-title">{ __( 'Jetpack Search' ) }</h3>
			</div>
			<div className="single-product__accented-card-body">
				<p>
					{ __(
						'Enhanced Search for your WordPress site that provides more relevant results using modern ' +
							'ranking algorithms, boosting of specific results, advanced filtering and faceting, and more. '
					) }
					<a href="https://jetpack.com/search" target="_blank" rel="noopener noreferrer">
						{ __( 'Learn More' ) }
					</a>
				</p>
				<h4 className="single-product-backup__options-header">
					{ __(
						'Your current site record size: %s record',
						'Your current site record size: %s records',
						{ args: recordCount, count: recordCount }
					) }
				</h4>
				<div className="single-product-search__radio-buttons-container">
					<PlanRadioButton
						billingTimeFrame={ BILLING_TIMEFRAME }
						checked={ true }
						currencyCode={ currencyCode }
						fullPrice={ yearlyPrice }
						onChange={ noop }
						planName={ getTierLabel(
							get( props.siteProducts, 'jetpack_search.price_tier_slug' ),
							recordCount
						) }
						radioValue={ yearlyPrice }
					/>
				</div>
				<div className="single-product-search__upgrade-button-container">
					<Button href={ props.searchUpgradeUrl } primary>
						{ __( 'Get Jetpack Search' ) }
					</Button>
				</div>
			</div>
		</div>
	);
}
