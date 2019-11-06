/**
 * External dependencies
 */
import React from 'react';

export function PlanPriceDisplay( props ) {
	const { dailyPrice, yearlyPrice } = props;
	const perYearPriceRange = `${ dailyPrice }-${ yearlyPrice } /year`;

	return (
		<div
			style={ {
				display: 'flex',
				flexDirection: 'row',
				justifyContent: 'space-between',
				alignContent: 'center',
			} }
		>
			<SlashedPrice />
			<div className="plans-price__container">
				<span className="plans-price__span">{ perYearPriceRange }</span>
			</div>
		</div>
	);
}

function SlashedPrice() {
	return (
		<div className="slashed-price__container" style={ { marginRight: '14px' } }>
			<div className="slashed-price__slash"></div>
			{ /* TODO: get this from an API or calculate, currently unsure how to get this increased price */ }
			<div className="slashed-price__price">{ '$15-25' }</div>
		</div>
	);
}

export function PlanRadioButton( props ) {
	const { checked, onChange, planName, radioValue, planPrice } = props;

	return (
		<div className="plans-section__radio-toggle">
			<div
				style={ {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
				} }
			>
				<input
					style={ { gridColumn: 1, gridRow: 1 } }
					type="radio"
					value={ radioValue }
					checked={ checked }
					onChange={ onChange }
				/>
			</div>
			<div style={ { gridColumn: 2, gridRow: 1, fontWeight: 'bold' } }>{ planName }</div>
			<div style={ { gridColumn: 2, gridRow: 2 } }>
				{ /* TODO: how to I18N this? */ }
				{ planPrice && `${ planPrice } /year` }
			</div>
		</div>
	);
}
