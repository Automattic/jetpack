/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import { get, noop } from 'lodash';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import PlanRadioButton from '../single-product-components/plan-radio-button';

const PLACEHOLDER_RECORD_COUNT = 53;
const PLACEHOLDER_PRICE = 50;
const PLACEHOLDER_LABEL = 'Tier 1: Up to 100 records';

export default function SingleProductSearchCard( props ) {
	const currencyCode = get( props.products, 'jetpack_backup_daily.currency_code', '' );

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
						'Your current site record size: %d record',
						'Your current site record size: %d records',
						{ args: PLACEHOLDER_RECORD_COUNT, count: PLACEHOLDER_RECORD_COUNT }
					) }
				</h4>
				<div className="single-product-search__radio-buttons-container">
					<PlanRadioButton
						billingTimeFrame="yearly"
						checked={ true }
						currencyCode={ currencyCode }
						fullPrice={ PLACEHOLDER_PRICE }
						onChange={ noop }
						planName={ PLACEHOLDER_LABEL }
						radioValue={ PLACEHOLDER_PRICE }
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
