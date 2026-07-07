import { RangeControl } from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NumberSliderProps } from './types.ts';
import type { FC, ReactElement } from 'react';
import './style.scss';

/**
 * Delay, in milliseconds, before a settled value is reported to `onAfterChange`.
 * RangeControl only fires a continuous `onChange`, so the value is treated as
 * "settled" once it stops changing for this long.
 */
const AFTER_CHANGE_DEBOUNCE_MS = 200;

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
 * @return {ReactElement} - JSX element
 */
const NumberSlider: FC< NumberSliderProps > = ( {
	className,
	disabled = false,
	maxValue = 100,
	minValue = 0,
	step = 1,
	value,
	onChange,
	onAfterChange,
} ) => {
	/*
	 * Track the value internally so the slider stays responsive while dragging,
	 * even when the consumer only updates `value` once the change has settled.
	 */
	const [ currentValue, setCurrentValue ] = useState( value );

	/*
	 * Remember the last value emitted from here so a consumer echoing it back
	 * through the `value` prop (e.g. after persisting it) does not snap the thumb
	 * back mid-interaction. Genuine external changes still take effect.
	 */
	const lastEmitted = useRef( value );
	useEffect( () => {
		if ( value !== lastEmitted.current ) {
			lastEmitted.current = value;
			setCurrentValue( value );
		}
	}, [ value ] );

	/*
	 * Keep the latest onAfterChange in a ref so the debounced callback identity
	 * stays stable across renders. Passing a fresh function to useDebounce on
	 * every render would recreate — and cancel — the debounced instance each time
	 * the value changes, dropping the trailing call entirely.
	 */
	const afterChangeRef = useRef( onAfterChange );
	useEffect( () => {
		afterChangeRef.current = onAfterChange;
	}, [ onAfterChange ] );

	const debouncedAfterChange = useDebounce(
		useCallback( ( newValue: number ) => {
			afterChangeRef.current?.( newValue );
		}, [] ),
		AFTER_CHANGE_DEBOUNCE_MS
	);

	const handleChange = useCallback(
		( newValue?: number ) => {
			/*
			 * RangeControl invokes onChange with undefined when the input is
			 * cleared; ignore until a valid number is committed.
			 */
			if ( typeof newValue !== 'number' ) {
				return;
			}
			lastEmitted.current = newValue;
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
				disabled={ disabled }
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
