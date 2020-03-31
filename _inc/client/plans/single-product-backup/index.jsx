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
import { getPlanDuration } from '../../state/plans';

function generateBackupOptions( {
	products,
	upgradeLinkDaily,
	upgradeLinkRealtime,
	planDuration,
} ) {
	const priceDailyMonthly = get( products, [ 'jetpack_backup_daily_monthly', 'cost' ], '' );
	const priceRealtimeMonthly = get( products, [ 'jetpack_backup_realtime_monthly', 'cost' ], '' );

	const priceDaily = get( products, [ 'jetpack_backup_daily', 'cost' ], '' );
	const priceDailyMonthlyPerYear = '' === priceDailyMonthly ? '' : priceDailyMonthly * 12;

	const priceRealtime = get( products, [ 'jetpack_backup_realtime', 'cost' ], '' );
	const priceRealtimeMonthlyPerYear = '' === priceRealtimeMonthly ? '' : priceRealtimeMonthly * 12;
	if ( 'yearly' === planDuration ) {
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
	return [
		{
			type: 'daily',
			name: __( 'Daily Backups' ),
			link: upgradeLinkDaily,
			fullPrice: priceDailyMonthly,
		},
		{
			type: 'real-time',
			name: __( 'Real-Time Backups' ),
			link: upgradeLinkRealtime,
			fullPrice: priceRealtimeMonthly,
		},
	];
}

function SingleProductBackupCard( props ) {
	const {
		products,
		backupInfoUrl,
		upgradeLinkDaily,
		upgradeLinkRealtime,
		selectedBackupType,
		setSelectedBackupType,
		planDuration,
	} = props;
	const currencyCode = get( products, [ 'jetpack_backup_daily', 'currency_code' ], '' );
	const backupOptions = useMemo(
		() =>
			generateBackupOptions( { products, upgradeLinkDaily, upgradeLinkRealtime, planDuration } ),
		[ products, upgradeLinkDaily, upgradeLinkRealtime, planDuration ]
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
					billingTimeFrame={ planDuration }
					currencyCode={ currencyCode }
					backupOptions={ backupOptions }
					backupInfoUrl={ backupInfoUrl }
					selectedBackupType={ selectedBackupType }
					setSelectedBackupType={ setSelectedBackupType }
				/>
			</div>
		</div>
	);
}

export default connect( state => ( {
	planDuration: getPlanDuration( state ),
	backupInfoUrl: getUpgradeUrl( state, 'aag-backups' ), // Redirect to https://jetpack.com/upgrade/backup/
	upgradeLinkDaily: getUpgradeUrl( state, 'jetpack-backup-daily', '', true ),
	upgradeLinkRealtime: getUpgradeUrl( state, 'jetpack-backup-realtime', '', true ),
} ) )( SingleProductBackupCard );
