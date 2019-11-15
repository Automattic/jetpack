/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

import './single-product-backup.scss';

export function PlanPriceDisplay( { backupPlanPrices, currencySymbol } ) {
	const perYearPriceRange = __(
		'%(currencySymbol)s%(dailyBackupYearlyPrice)s-%(realtimeBackupYearlyPrice)s /year',
		{
			args: {
				currencySymbol,
				dailyBackupYearlyPrice: backupPlanPrices.jetpack_backup_daily.yearly,
				realtimeBackupYearlyPrice: backupPlanPrices.jetpack_backup_realtime.yearly,
			},
			comment: 'Shows a range of prices, such as $12-15 /year',
		}
	);

	const fullDailyBackupYearlyCost = backupPlanPrices.jetpack_backup_daily.monthly * 12;
	const fullRealtimeBackupYearlyCost = backupPlanPrices.jetpack_backup_realtime.monthly * 12;

	return (
		<div className="single-product-backup__plan-price-display-container">
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

export function PlanRadioButton( {
	checked,
	currencySymbol,
	onChange,
	planName,
	radioValue,
	planPrice,
} ) {
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
			{ __( '%(currencySymbol)s%(planPrice)s /year', {
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
