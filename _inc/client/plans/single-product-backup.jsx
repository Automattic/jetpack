/**
 * External dependencies
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { getCurrencyDefaults } from '@automattic/format-currency';
import { translate as __ } from 'i18n-calypso';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import ExternalLink from 'components/external-link';

import './single-product-backup.scss';

export function SingleProductBackup( { products, upgradeLinks } ) {
	const [ selectedBackupType, setSelectedBackupType ] = useState( 'real-time' );

	const backupPlanPrices = {
		jetpack_backup_daily: {
			monthly: get( products, [ 'jetpack_backup_daily_monthly', 'cost' ], '' ),
			yearly: get( products, [ 'jetpack_backup_daily', 'cost' ], '' ),
		},
		jetpack_backup_realtime: {
			monthly: get( products, [ 'jetpack_backup_realtime_monthly', 'cost' ], '' ),
			yearly: get( products, [ 'jetpack_backup_realtime', 'cost' ], '' ),
		},
	};

	const currency_code = get( products, [ 'jetpack_backup_daily', 'currency_code' ], '' );
	const currencySymbol = getCurrencyDefaults( currency_code ).symbol;

	return (
		<React.Fragment>
			<h1 className="plans-section__header">{ __( 'Solutions' ) }</h1>
			<h2 className="plans-section__subheader">
				{ __( "Just looking for backups? We've got you covered." ) }
			</h2>
			<div className="plans-section__single-product">
				<div className="single-product-backup__accented-card">
					<div className="single-product-backup__accented-card-header">
						<SingleProductBackupHeader
							currencySymbol={ currencySymbol }
							backupPlanPrices={ backupPlanPrices }
						/>
					</div>
					<div className="single-product-backup__accented-card-body">
						<SingleProductBackupBody
							backupPlanPrices={ backupPlanPrices }
							currencySymbol={ currencySymbol }
							selectedBackupType={ selectedBackupType }
							setSelectedBackupType={ setSelectedBackupType }
							upgradeLinks={ upgradeLinks }
						/>
					</div>
				</div>
			</div>
		</React.Fragment>
	);
}

function SingleProductBackupHeader( { currencySymbol, backupPlanPrices } ) {
	return (
		<div className="single-product-backup__header-container">
			<h3 className="single-product-backup__header-title">{ __( 'Jetpack Backup' ) }</h3>
			<PlanPriceDisplay currencySymbol={ currencySymbol } backupPlanPrices={ backupPlanPrices } />
		</div>
	);
}

export function PlanPriceDisplay( { backupPlanPrices, currencySymbol } ) {
	const dailyBackupYearlyPrice = backupPlanPrices.jetpack_backup_daily.yearly;
	const dailyBackupMonthlyPrice = backupPlanPrices.jetpack_backup_daily.monthly;

	const realtimeBackupYearlyPrice = backupPlanPrices.jetpack_backup_realtime.yearly;
	const realtimeBackupMonthlyPrice = backupPlanPrices.jetpack_backup_realtime.monthly;

	const fullDailyBackupYearlyCost = dailyBackupMonthlyPrice * 12;
	const fullRealtimeBackupYearlyCost = realtimeBackupMonthlyPrice * 12;

	const perYearPriceRange = __(
		'%(currencySymbol)s%(dailyBackupYearlyPrice)s-%(realtimeBackupYearlyPrice)s per year',
		{
			args: {
				currencySymbol,
				dailyBackupYearlyPrice,
				realtimeBackupYearlyPrice,
			},
			comment: 'Shows a range of prices, such as $12-15 per year',
		}
	);

	return (
		<div className="single-product-backup__header-price">
			<div className="discounted-price__container">
				<div className="discounted-price__slash"></div>
				<div className="discounted-price__price">
					{ __( '%(currencySymbol)s%(lowPrice)s-%(highPrice)s', {
						args: {
							currencySymbol,
							lowPrice: fullDailyBackupYearlyCost,
							highPrice: fullRealtimeBackupYearlyCost,
						},
						comment:
							"Describes how much a plan will cost per year. %(currencySymbol) is the currency symbol of the user's locale (e.g. $). %(planPrice) is the cost of a plan (e.g. 20).",
					} ) }
				</div>
			</div>
			<div className="plans-price__container">
				<span className="plans-price__price-range">{ perYearPriceRange }</span>
			</div>
		</div>
	);
}

function PlanRadioButton( { checked, currencySymbol, onChange, planName, radioValue, planPrice } ) {
	return (
		<label className="plan-radio-button__label">
			<input
				type="radio"
				className="plan-radio-button__input"
				value={ radioValue }
				checked={ checked }
				onChange={ onChange }
			/>
			{ planName }
			<br />
			{ __( '%(currencySymbol)s%(planPrice)s per year', {
				args: {
					currencySymbol: currencySymbol,
					planPrice: planPrice,
				},
				comment:
					"Describes how much a plan will cost per year. %(currencySymbol) is the currency symbol of the user's locale (e.g. $). %(planPrice) is the cost of a plan (e.g. 20).",
			} ) }
		</label>
	);
}

// eslint-disable-next-line no-unused-vars
class SingleProductBackupBody extends React.Component {
	static propTypes = {
		backupPlanPrices: PropTypes.object,
		currencySymbol: PropTypes.string,
		setSelectedBackupType: PropTypes.func,
		selectedBackupType: PropTypes.string,
		upgradeLinks: PropTypes.object,
	};

	handleSelectedBackupTypeChange = event => {
		this.props.setSelectedBackupType( event.target.value );
	};

	render() {
		const { currencySymbol, backupPlanPrices, selectedBackupType, upgradeLinks } = this.props;

		const upgradeTitles = {
			'real-time': __( 'Upgrade to Real-Time Backups' ),
			daily: __( 'Upgrade to Daily Backups' ),
		};

		const backupOptions = [
			{
				type: 'daily',
				name: __( 'Daily Backups' ),
				price: backupPlanPrices.jetpack_backup_daily.yearly,
			},
			{
				type: 'real-time',
				name: __( 'Real-Time Backups' ),
				price: backupPlanPrices.jetpack_backup_realtime.yearly,
			},
		];

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
							checked={ option.type === selectedBackupType }
							currencySymbol={ currencySymbol }
							planName={ option.name }
							planPrice={ option.price }
							onChange={ this.handleSelectedBackupTypeChange }
							radioValue={ option.type }
						/>
					) ) }
				</div>
				{ upgradeLinks &&
					upgradeLinks[ selectedBackupType ] &&
					upgradeTitles[ selectedBackupType ] && (
						<div className="single-product-backup__upgrade-button-container">
							<Button href={ upgradeLinks[ selectedBackupType ] } primary>
								{ upgradeTitles[ selectedBackupType ] }
							</Button>
						</div>
					) }
			</React.Fragment>
		);
	}
}
