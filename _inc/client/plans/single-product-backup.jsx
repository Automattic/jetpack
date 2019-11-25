/**
 * External dependencies
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { translate as __ } from 'i18n-calypso';
import { get } from 'lodash';
import { withRouter } from 'react-router';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Button from 'components/button';
import ExternalLink from 'components/external-link';
import PlanPrice from 'components/plans/plan-price';

import './single-product-backup.scss';

export function SingleProductBackup( { plan, products, upgradeLinks, isFetchingData } ) {
	// Don't show the product card for paid plans.
	if ( ! isFetchingData && 'jetpack_free' !== plan ) {
		return null;
	}

	return (
		<React.Fragment>
			<div className="plans-section__single-product">
				{ isFetchingData ? (
					<div className="plans-section__single-product-skeleton is-placeholder" />
				) : (
					<SingleProductBackupCard products={ products } upgradeLinks={ upgradeLinks } />
				) }
			</div>
		</React.Fragment>
	);
}

function SingleProductBackupCard( { products, upgradeLinks } ) {
	const [ selectedBackupType, setSelectedBackupType ] = useState( 'real-time' );
	const billingTimeFrame = 'yearly';
	const currencyCode = get( products, [ 'jetpack_backup_daily', 'currency_code' ], '' );
	const priceDaily = get( products, [ 'jetpack_backup_daily', 'cost' ], '' );
	const priceDailyMonthly = get( products, [ 'jetpack_backup_daily_monthly', 'cost' ], '' );
	const priceDailyMonthlyPerYear = '' === priceDailyMonthly ? '' : priceDailyMonthly * 12;
	const priceRealtime = get( products, [ 'jetpack_backup_realtime', 'cost' ], '' );
	const priceRealtimeMonthly = get( products, [ 'jetpack_backup_realtime_monthly', 'cost' ], '' );
	const priceRealtimeMonthlyPerYear = '' === priceRealtimeMonthly ? '' : priceRealtimeMonthly * 12;

	// TODO: Move out those somewhere else to make this a flexible and fully reusable component.
	const backupOptions = [
		{
			type: 'daily',
			name: __( 'Daily Backups' ),
			discountedPrice: priceDaily,
			fullPrice: priceDailyMonthlyPerYear,
		},
		{
			type: 'real-time',
			name: __( 'Real-Time Backups' ),
			discountedPrice: priceRealtime,
			fullPrice: priceRealtimeMonthlyPerYear,
		},
	];

	return (
		<div className="single-product-backup__accented-card dops-card">
			<div className="single-product-backup__accented-card-header">
				<h3 className="single-product-backup__header-title">{ __( 'Jetpack Backup' ) }</h3>
				<SingleProductBackupPriceGroup
					billingTimeFrame={ billingTimeFrame }
					currencyCode={ currencyCode }
					discountedPrice={ [ priceDaily, priceRealtime ] }
					fullPrice={ [ priceDailyMonthlyPerYear, priceRealtimeMonthlyPerYear ] }
				/>
			</div>
			<div className="single-product-backup__accented-card-body">
				<SingleProductBackupBodyWithRouter
					billingTimeFrame={ billingTimeFrame }
					currencyCode={ currencyCode }
					backupOptions={ backupOptions }
					selectedBackupType={ selectedBackupType }
					setSelectedBackupType={ setSelectedBackupType }
					upgradeLinks={ upgradeLinks }
				/>
			</div>
		</div>
	);
}

function SingleProductBackupPriceGroup( {
	billingTimeFrame,
	currencyCode,
	discountedPrice,
	fullPrice,
} ) {
	const timeframe = <div className="single-product-backup__price-group-billing-timeframe" />;
	let price = <PlanPrice currencyCode={ currencyCode } rawPrice={ fullPrice } />;

	if ( !! discountedPrice ) {
		price = (
			<React.Fragment>
				<PlanPrice currencyCode={ currencyCode } rawPrice={ fullPrice } original />
				<PlanPrice currencyCode={ currencyCode } rawPrice={ discountedPrice } discounted />
			</React.Fragment>
		);
	}
	return (
		<div className="single-product-backup__price-group">
			{ billingTimeFrame === 'yearly' &&
				__( '{{price/}} {{timeframe}}per year{{/timeframe}}', {
					components: { price, timeframe },
					comment:
						'Describes how much a product costs. {{price/}} can be a single value or a range of values',
				} ) }
			{ billingTimeFrame === 'monthly' &&
				__( '{{price/}} {{timeframe}}per month{{/timeframe}}', {
					components: { price, timeframe },
					comment:
						'Describes how much a product costs. {{price/}} can be a single value or a range of values',
				} ) }
		</div>
	);
}

function PlanRadioButton( {
	checked,
	billingTimeFrame,
	currencyCode,
	discountedPrice,
	fullPrice,
	onChange,
	planName,
	radioValue,
} ) {
	return (
		<label className="plan-radio-button">
			<input
				type="radio"
				className="plan-radio-button__input"
				value={ radioValue }
				checked={ checked }
				onChange={ onChange }
			/>
			<div className="plan-radio-button__label">
				<span className="plan-radio-button__title">{ planName }</span>
				<SingleProductBackupPriceGroup
					billingTimeFrame={ billingTimeFrame }
					currencyCode={ currencyCode }
					discountedPrice={ discountedPrice }
					fullPrice={ fullPrice }
				/>
			</div>
		</label>
	);
}

// eslint-disable-next-line no-unused-vars
class SingleProductBackupBody extends React.Component {
	static propTypes = {
		backupOptions: PropTypes.array,
		billingTimeFrame: PropTypes.string,
		currencyCode: PropTypes.string,
		setSelectedBackupType: PropTypes.func,
		selectedBackupType: PropTypes.string,
		upgradeLinks: PropTypes.object,
	};

	handleSelectedBackupTypeChange = event => {
		this.props.setSelectedBackupType( event.target.value );
	};

	handleUpgradeButtonClick = selectedBackupType => () => {
		analytics.tracks.recordJetpackClick( {
			target: `upgrade-${ selectedBackupType }`,
			type: 'upgrade',
			product: selectedBackupType,
			page: this.props.routes[ 0 ] && this.props.routes[ 0 ].name,
		} );
	};

	handleLandingPageLinkClick = selectedBackupType => () => {
		analytics.tracks.recordJetpackClick( {
			target: 'landing-page-link',
			feature: 'single-product-backup',
			extra: selectedBackupType,
		} );
	};

	render() {
		const {
			backupOptions,
			billingTimeFrame,
			currencyCode,
			selectedBackupType,
			upgradeLinks,
		} = this.props;

		// TODO: Move out those somewhere else to make this a flexible and fully reusable component.
		const upgradeTitles = {
			'real-time': __( 'Upgrade to Real-Time Backups' ),
			daily: __( 'Upgrade to Daily Backups' ),
		};

		return (
			<React.Fragment>
				<p>
					{ __(
						'Always-on backups ensure you never lose your site. Choose from real-time or daily backups. {{a}}Which one do I need?{{/a}}',
						{
							components: {
								a: (
									<ExternalLink
										target="_blank"
										href="https://jetpack.com/upgrade/backup/"
										icon
										iconSize={ 12 }
										onClick={ this.handleLandingPageLinkClick( selectedBackupType ) }
									/>
								),
							},
						}
					) }
				</p>
				<h4 className="single-product-backup__options-header">{ __( 'Backup options:' ) }</h4>
				<div className="single-product-backup__radio-buttons-container">
					{ backupOptions.map( option => (
						<PlanRadioButton
							key={ option.type }
							billingTimeFrame={ billingTimeFrame }
							checked={ option.type === selectedBackupType }
							currencyCode={ currencyCode }
							fullPrice={ option.fullPrice }
							discountedPrice={ option.discountedPrice }
							onChange={ this.handleSelectedBackupTypeChange }
							radioValue={ option.type }
							planName={ option.name }
						/>
					) ) }
				</div>
				{ upgradeLinks &&
					upgradeLinks[ selectedBackupType ] &&
					upgradeTitles[ selectedBackupType ] && (
						<div className="single-product-backup__upgrade-button-container">
							<Button
								href={ upgradeLinks[ selectedBackupType ] }
								onClick={ this.handleUpgradeButtonClick( selectedBackupType ) }
								primary
							>
								{ upgradeTitles[ selectedBackupType ] }
							</Button>
						</div>
					) }
			</React.Fragment>
		);
	}
}

const SingleProductBackupBodyWithRouter = withRouter( SingleProductBackupBody );
