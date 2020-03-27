/**
 * External dependencies
 */
import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import { getUpgradeUrl } from 'state/initial-state';
import { BACKUP_TITLE } from '../constants';
import SingleProductBackupBody from './body';

function generateBackupOptions( { products, upgradeLinkDaily, upgradeLinkRealtime } ) {
	const priceDailyMonthly = get( products, [ 'jetpack_backup_daily_monthly', 'cost' ], '' );
	const priceRealtimeMonthly = get( products, [ 'jetpack_backup_realtime_monthly', 'cost' ], '' );
	const priceDaily = get( products, [ 'jetpack_backup_daily', 'cost' ], '' );
	const priceDailyMonthlyPerYear = '' === priceDailyMonthly ? '' : priceDailyMonthly * 12;
	const priceRealtime = get( products, [ 'jetpack_backup_realtime', 'cost' ], '' );
	const priceRealtimeMonthlyPerYear = '' === priceRealtimeMonthly ? '' : priceRealtimeMonthly * 12;

	return [
		{
			type: 'daily',
			name: __( 'Daily Backups' ),
			link: upgradeLinkDaily,
			discountedPrice: priceDaily,
			fullPrice: priceDailyMonthlyPerYear,
			potentialSavings:
				priceDailyMonthlyPerYear && priceDaily ? priceDailyMonthlyPerYear - priceDaily : null,
		},
		{
			type: 'real-time',
			name: __( 'Real-Time Backups' ),
			link: upgradeLinkRealtime,
			discountedPrice: priceRealtime,
			fullPrice: priceRealtimeMonthlyPerYear,
			potentialSavings:
				priceRealtimeMonthlyPerYear && priceRealtime
					? priceRealtimeMonthlyPerYear - priceRealtime
					: null,
		},
	];
}

function SingleProductBackupCard( props ) {
	const {
		products,
		upgradeLinkDaily,
		upgradeLinkRealtime,
		selectedBackupType,
		setSelectedBackupType,
	} = props;
	const billingTimeFrame = 'yearly';
	const currencyCode = get( products, [ 'jetpack_backup_daily', 'currency_code' ], '' );
	const backupOptions = useMemo(
		() => generateBackupOptions( { products, upgradeLinkDaily, upgradeLinkRealtime } ),
		[ products, upgradeLinkDaily, upgradeLinkRealtime ]
	);

	return props.isFetching ? (
		<div className="plans-section__single-product-skeleton is-placeholder" />
	) : (
		<div className="single-product__accented-card dops-card">
			<div className="single-product__accented-card-header">
				<h3 className="single-product-backup__header-title">{ BACKUP_TITLE }</h3>
			</div>
			<div className="single-product__accented-card-body">
				<SingleProductBackupBody
					billingTimeFrame={ billingTimeFrame }
					currencyCode={ currencyCode }
					backupOptions={ backupOptions }
					selectedBackupType={ selectedBackupType }
					setSelectedBackupType={ setSelectedBackupType }
				/>
			</div>
		</div>
	);
}

export default connect( state => ( {
	upgradeLinkDaily: getUpgradeUrl( state, 'jetpack-backup-daily' ),
	upgradeLinkRealtime: getUpgradeUrl( state, 'jetpack-backup-realtime' ),
} ) )( SingleProductBackupCard );
