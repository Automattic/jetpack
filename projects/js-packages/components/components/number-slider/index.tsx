import clsx from 'clsx';
import React from 'react';
import ReactSlider, { ReactSliderProps } from 'react-slider';
import { NumberSliderProps } from './types.js';
import './style.scss';

/**
 * Generate Number Slider
 * More support from the original ReactSlider component: https://zillow.github.io/react-slider/
 *
 * @param {NumberSliderProps} props - Props
 * @return {React.ReactElement} - JSX element
 */
const NumberSlider: React.FC< NumberSliderProps > = ( {
	className,
	maxValue = 100,
	minValue = 0,
	step = 1,
	value,
	onChange,
	onBeforeChange,
	onAfterChange,
	renderThumb,
} ) => {
	const [ isThumbHolding, setIsThumbHolding ] = React.useState( false );

	const componentClassName = clsx( 'jp-components-number-slider', className, {
		'jp-components-number-slider--is-holding': isThumbHolding,
	} );

	const onBeforeChangeCallback = beforeValue => {
		setIsThumbHolding( true );

		if ( typeof onBeforeChange === 'function' ) {
			onBeforeChange( beforeValue );
		}
	};

	const onAfterChangeCallback = afterValue => {
		setIsThumbHolding( false );

		if ( typeof onAfterChange === 'function' ) {
			onAfterChange( afterValue );
		}
	};

	const renderThumbCallback = renderThumb
		? renderThumb
		: ( props, state ) => {
				const { key, ...otherProps } = props;

				return (
					<div key={ key } { ...otherProps }>
						{ state.valueNow }
					</div>
				);
		  };

	/**
	 * Type casting to prevent TypeScript error:
	 * TS2604: JSX element type 'ReactSlider' does not have any construct or call signatures.
	 */
	const TypedReactSlider = ReactSlider as unknown as React.ComponentType< ReactSliderProps >;

	return (
		<div className={ componentClassName } data-testid="number-slider">
			<TypedReactSlider
				className="jp-components-number-slider__control"
				thumbClassName="jp-components-number-slider__thumb"
				thumbActiveClassName="jp-components-number-slider__thumb--is-active"
				trackClassName="jp-components-number-slider__track"
				value={ value }
				max={ maxValue }
				min={ minValue }
				step={ step }
				renderThumb={ renderThumbCallback } // eslint-disable-line react/jsx-no-bind
				onChange={ onChange }
				onBeforeChange={ onBeforeChangeCallback } // eslint-disable-line react/jsx-no-bind
				onAfterChange={ onAfterChangeCallback } // eslint-disable-line react/jsx-no-bind
			/>
		</div>
	);
};

export default NumberSlider;
