/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import PriceGroup from './price-group';
import './plan-radio-button.scss';

export default function PlanRadioButton( props ) {
	return (
		<label className="plan-radio-button">
			<input
				type="radio"
				className="plan-radio-button__input"
				value={ props.radioValue }
				checked={ props.checked }
				onChange={ props.onChange }
			/>
			<div className="plan-radio-button__label">
				<span className="plan-radio-button__title">{ props.planName }</span>
				<PriceGroup
					billingTimeFrame={ props.billingTimeFrame }
					currencyCode={ props.currencyCode }
					discountedPrice={ props.discountedPrice }
					fullPrice={ props.fullPrice }
				/>
			</div>
		</label>
	);
}
