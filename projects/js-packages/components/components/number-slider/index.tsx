import { RangeControl } from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { NumberSliderProps } from './types.ts';
import type { FC } from 'react';
import './style.scss';

/**
 * Number Slider
 *
 * A thin wrapper around the WordPress RangeControl component.
 *
 * RangeControl only exposes a single `onChange` callback that fires on every
 * value change. To preserve the original two-callback contract, `onChange` is
 * forwarded live and `onAfterChange` is fired (debounced) once the value stops
 * changing, so consumers that persist the value only run their work when the
 * interaction settles rather than on every drag tick.
 *
 * @param {NumberSliderProps} props - Props
 * @return {import('react').ReactElement} - JSX element
 */
const NumberSlider: FC< NumberSliderProps > = ( {
	className,
	maxValue = 100,
	minValue = 0,
	step = 1,
	value,
	onChange,
	onAfterChange,
} ) => {
	// Track the value internally so the slider stays responsive while dragging,
	// even when the consumer only updates `value` once the change has settled.
	const [ currentValue, setCurrentValue ] = useState( value );

	useEffect( () => {
		setCurrentValue( value );
	}, [ value ] );

	const debouncedAfterChange = useDebounce( ( newValue: number ) => {
		onAfterChange?.( newValue );
	}, 200 );

	const handleChange = useCallback(
		( newValue?: number ) => {
			if ( typeof newValue !== 'number' ) {
				return;
			}
			setCurrentValue( newValue );
			onChange?.( newValue );
			debouncedAfterChange( newValue );
		},
		[ onChange, debouncedAfterChange ]
	);

	return (
		<div className={ clsx( 'jp-components-number-slider', className ) } data-testid="number-slider">
			<RangeControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				className="jp-components-number-slider__control"
				value={ currentValue }
				min={ minValue }
				max={ maxValue }
				step={ step }
				onChange={ handleChange }
			/>
		</div>
	);
};

export default NumberSlider;
