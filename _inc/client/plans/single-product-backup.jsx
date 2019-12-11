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
					<SingleProductBackupCard
						products={ products }
						upgradeLinks={ upgradeLinks }
						// TODO: Wire to picker
						billingTimeFrame="yearly"
					/>
				) }
			</div>
		</React.Fragment>
	);
}

function PromoNudge() {
	return (
		<div className="single-product-backup__promo">
			<div className="single-product-backup__promo-star">
				<img src={ `${ imagePath }/green-star.svg` } alt="" />
				<span className="single-product-backup__promo-star-text">{ __( 'Up to 70% off!' ) }</span>
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

function SingleProductBackupCard( { products, upgradeLinks, billingTimeFrame } ) {
	const [ selectedBackupType, setSelectedBackupType ] = useState( 'realTime' );
	const currencyCode = get( products, [ 'jetpack_backup_daily', 'currency_code' ], '' );
	const priceDailyAnnual = get( products, [ 'jetpack_backup_daily', 'cost' ], '' );
	const priceDailyMonthly = get( products, [ 'jetpack_backup_daily_monthly', 'cost' ], '' );
	const priceDailyMonthlyPerYear = '' === priceDailyMonthly ? '' : priceDailyMonthly * 12;
	const priceRealtimeAnnual = get( products, [ 'jetpack_backup_realtime', 'cost' ], '' );
	const priceRealtimeMonthly = get( products, [ 'jetpack_backup_realtime_monthly', 'cost' ], '' );
	const priceRealtimeMonthlyPerYear = '' === priceRealtimeMonthly ? '' : priceRealtimeMonthly * 12;

	// TODO: Move out those somewhere else to make this a flexible and fully reusable component.
	let dailyOptions = {
		type: 'daily',
		name: __( 'Daily Backups' ),
		link: upgradeLinks.daily,
		potentialSavings: priceDailyMonthlyPerYear - priceDailyAnnual,
	};
	let realTimeOptions = {
		type: 'realTime',
		name: __( 'Real-Time Backups' ),
		link: upgradeLinks[ 'real-time' ],
		potentialSavings: priceRealtimeMonthlyPerYear - priceRealtimeAnnual,
	};

	if ( 'yearly' === billingTimeFrame ) {
		dailyOptions = {
			...dailyOptions,
			discountedPrice: priceDailyAnnual,
			fullPrice: priceDailyMonthlyPerYear,
		};
		realTimeOptions = {
			...realTimeOptions,
			discountedPrice: priceRealtimeAnnual,
			fullPrice: priceRealtimeMonthlyPerYear,
		};
	} else if ( 'monthly' === billingTimeFrame ) {
		dailyOptions.fullPrice = priceDailyMonthly;
		realTimeOptions.fullPrice = priceRealtimeMonthly;
	}

	return (
		<div className="single-product-backup__accented-card dops-card">
			<div className="single-product-backup__accented-card-header">
				<h3 className="single-product-backup__header-title">{ __( 'Jetpack Backup' ) }</h3>
			</div>
			<div className="single-product-backup__accented-card-body">
				<SingleProductBackupBodyWithRouter
					billingTimeFrame={ billingTimeFrame }
					currencyCode={ currencyCode }
					backupOptions={ { realTime: realTimeOptions, daily: dailyOptions } }
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

function PlanSavingsText( { selectedBackup, billingTimeFrame, currencyCode } ) {
	if ( ! selectedBackup ) {
		return null;
	}
	const savingsCurrencyObject = getCurrencyObject( selectedBackup.potentialSavings, currencyCode );
	const savings = formatCurrency( savingsCurrencyObject );

	// TODO: Provide way to switch billing time frame state.
	const switchComponent = <a />;

	let promptText;
	if ( 'yearly' === billingTimeFrame ) {
		promptText = __( 'You are saving %(savings)s by paying yearly. {{a}}Switch to monthly{{/a}}', {
			args: { savings },
			components: {
				a: switchComponent,
			},
		} );
	} else if ( 'monthly' === billingTimeFrame ) {
		promptText = __(
			'You could be saving %(savings)s by paying yearly. {{a}}Switch to yearly{{/a}}',
			{
				args: { savings },
				components: {
					a: switchComponent,
				},
			}
		);
	}

	if ( ! promptText ) {
		return null;
	}
	return (
		<p>
			<em>{ promptText }</em>
		</p>
	);
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
				{ __( 'Upgrade to %(name)s for %(price)s/%(billingTime)s', {
					args: {
						name,
						billingTime: billingTimeFrameString,
						price: formatCurrency( currencyObject ),
					},
					comment: 'Button to purchase plan. {{price}} can be a range of values.',
				} ) }
			</Button>
		</div>
	);
}

// Placeholder for formatting the currency without zeros
// until https://github.com/Automattic/wp-calypso/pull/36039
// is released.
function formatCurrency( { symbol, integer, raw, fraction } ) {
	return `${ symbol }${ integer }${ raw - integer > 0 ? fraction : '' }`;
}

class SingleProductBackupBody extends React.Component {
	static propTypes = {
		backupOptions: PropTypes.shape( {
			realTime: PropTypes.object,
			daily: PropTypes.object,
		} ),
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

		const selectedBackup = get( backupOptions, selectedBackupType, null );

		return (
			<React.Fragment>
				<p>{ __( 'Always-on backups ensure you never lose your site.' ) }</p>
				<PromoNudge />
				<h4 className="single-product-backup__options-header">
					{ __( 'Select a backup option:' ) }
				</h4>
				<div className="single-product-backup__radio-buttons-container">
					{ Object.values( backupOptions ).map( option => (
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
				<PlanSavingsText
					selectedBackup={ selectedBackup }
					billingTimeFrame={ billingTimeFrame }
					currencyCode={ currencyCode }
				/>
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
