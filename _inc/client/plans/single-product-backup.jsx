/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

import './single-product-backup.scss';

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
