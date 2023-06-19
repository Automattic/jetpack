import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import React from 'react';
import ReactSlider from 'react-slider';
import { PricingSliderProps } from './types';
import './style.scss';

/**
 * Generate Pricing Slider
 * More support from the original ReactSlider component: https://zillow.github.io/react-slider/
 *
 * @param {PricingSliderProps} props - Props
 * @returns {React.ReactElement} - JSX element
 */
const PricingSlider: React.FC< PricingSliderProps > = ( {
	className,
	maxValue = 100,
	minValue = 0,
	step = 1,
	value,
	onChange,
	onBeforeChange,
	onAfterChange,
} ) => {
	const componentClassName = classNames( 'jp-components__pricing-slider', className );

	const renderThumb = ( props, state ) => {
		return <div { ...props }>{ `$${ state.valueNow } / ${ __( 'Year', 'jetpack' ) }` }</div>;
	};

	return (
		<div className={ componentClassName } data-testid="pricing-slider">
			<ReactSlider
				className="pricing-slider"
				thumbClassName="pricing-slider__thumb"
				thumbActiveClassName="pricing-slider__thumb--is-active"
				trackClassName="pricing-slider__track"
				value={ value }
				max={ maxValue }
				min={ minValue }
				step={ step }
				renderThumb={ renderThumb } // eslint-disable-line react/jsx-no-bind
				onChange={ onChange } // eslint-disable-line react/jsx-no-bind
				onBeforeChange={ onBeforeChange } // eslint-disable-line react/jsx-no-bind
				onAfterChange={ onAfterChange } // eslint-disable-line react/jsx-no-bind
			/>
		</div>
	);
};

export default PricingSlider;
