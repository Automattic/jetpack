/**
 * External dependencies
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { translate as __ } from 'i18n-calypso';
import { get } from 'lodash';
import { withRouter } from 'react-router';
import { getCurrencyObject } from '@automattic/format-currency';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Button from 'components/button';
import PlanPrice from 'components/plans/plan-price';
import { imagePath } from 'constants/urls';

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

function PromoNudge() {
	const percent = 70;

	return (
		<div className="single-product-backup__promo">
			<div className="single-product-backup__promo-star">
				<img src={ `${ imagePath }/green-star.svg` } alt="" />
				<span className="single-product-backup__promo-star-text">
					{ __( 'Up to %(percent)d%% off!', { args: { percent } } ) }
				</span>
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
			link: upgradeLinks.daily,
			discountedPrice: priceDaily,
			fullPrice: priceDailyMonthlyPerYear,
			potentialSavings: priceDailyMonthlyPerYear - priceDaily,
		},
		{
			type: 'real-time',
			name: __( 'Real-Time Backups' ),
			link: upgradeLinks[ 'real-time' ],
			discountedPrice: priceRealtime,
			fullPrice: priceRealtimeMonthlyPerYear,
			potentialSavings: priceRealtimeMonthlyPerYear - priceRealtime,
		},
	];

	return (
		<div className="single-product-backup__accented-card dops-card">
			<div className="single-product-backup__accented-card-header">
				<h3 className="single-product-backup__header-title">{ __( 'Jetpack Backup' ) }</h3>
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

function ProductSavings( { selectedBackup, currencyCode } ) {
	if ( ! selectedBackup ) {
		return null;
	}
	const savingsCurrencyObject = getCurrencyObject( selectedBackup.potentialSavings, currencyCode );
	const savings = formatCurrency( savingsCurrencyObject );

	return __( 'You are saving %(savings)s by paying yearly', {
		args: { savings },
	} );
}

function UpgradeButton( { selectedUpgrade, billingTimeFrame, currencyCode, onClickHandler } ) {
	if ( ! selectedUpgrade ) {
		return null;
	}
	const { link, name, fullPrice, discountedPrice, type } = selectedUpgrade;
	let billingTimeFrameString = '';
	if ( 'yearly' === billingTimeFrame ) {
		billingTimeFrameString = __( 'per year', { context: 'Amount of money per time unit.' } );
	} else if ( 'monthly' === billingTimeFrame ) {
		billingTimeFrameString = __( 'per month', { context: 'Amount of money per time unit.' } );
	}

	const currencyObject = getCurrencyObject( discountedPrice || fullPrice, currencyCode );

	return (
		<div className="single-product-backup__upgrade-button-container">
			<Button href={ link } onClick={ onClickHandler( type ) } primary>
				{ __( 'Upgrade to %(name)s for %(price)s %(billingTimeFrame)s', {
					args: {
						name,
						billingTimeFrame: billingTimeFrameString,
						price: formatCurrency( currencyObject ),
					},
					comment:
						'Button to purchase product upgrade. %(price) can be a range of prices, and %(billingTimeFrame) is the billing period for the product upgrade.',
				} ) }
			</Button>
		</div>
	);
}

// Placeholder for formatting the currency without zeros
// until https://github.com/Automattic/wp-calypso/pull/36039
// is released.
function formatCurrency( { symbol, integer } ) {
	return `${ symbol }${ integer }`;
}

class SingleProductBackupBody extends React.Component {
	static propTypes = {
		backupOptions: PropTypes.array,
		billingTimeFrame: PropTypes.string,
		currencyCode: PropTypes.string,
		setSelectedBackupType: PropTypes.func,
		selectedBackupType: PropTypes.string,
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

	render() {
		const { backupOptions, billingTimeFrame, currencyCode, selectedBackupType } = this.props;

		const selectedBackup = backupOptions.find( ( { type } ) => type === selectedBackupType );

		return (
			<React.Fragment>
				<p>{ __( 'Always-on backups ensure you never lose your site.' ) }</p>
				<PromoNudge />
				<h4 className="single-product-backup__options-header">
					{ __( 'Select a backup option:' ) }
				</h4>
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
				<p>
					<em>
						<ProductSavings
							selectedBackup={ selectedBackup }
							billingTimeFrame={ billingTimeFrame }
							currencyCode={ currencyCode }
						/>
					</em>
				</p>
				<UpgradeButton
					selectedUpgrade={ selectedBackup }
					billingTimeFrame={ billingTimeFrame }
					currencyCode={ currencyCode }
					onClickHandler={ this.handleUpgradeButtonClick }
				/>
			</React.Fragment>
		);
	}
}

const SingleProductBackupBodyWithRouter = withRouter( SingleProductBackupBody );
