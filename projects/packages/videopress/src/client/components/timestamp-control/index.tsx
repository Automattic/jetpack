/**
 * External dependencies
 */
import {
	// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
	__experimentalNumberControl,
	TextControl,
	RangeControl,
	BaseControl,
	useBaseControlProps as originalUseBaseControlProps,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { formatTime } from '../../utils/time';
import styles from './style.module.scss';
/**
 * Types
 */
import { TimestampInputProps, TimestampControlProps, DecimalPlacesProp } from './types';
import type React from 'react';

/**
 * Fallback implementation of useBaseControlProps.
 *
 * @param {object} props - The component props.
 * @returns {object}     - The computed control props.
 */
function useBaseControlPropsFallback( props: Record< string, unknown > ): {
	baseControlProps: Record< string, unknown >;
	controlProps: Record< string, unknown >;
} {
	const { help, id: preferredId, ...restProps } = props;

	const uniqueId = useInstanceId(
		BaseControl,
		'wp-components-base-control',
		preferredId as string
	);

	// ARIA descriptions can only contain plain text, so fall back to aria-details if not.
	const helpPropName = typeof help === 'string' ? 'aria-describedby' : 'aria-details';

	return {
		baseControlProps: {
			id: uniqueId,
			help,
			...restProps,
		},
		controlProps: {
			id: uniqueId,
			...( help ? { [ helpPropName ]: `${ uniqueId }__help` } : {} ),
		},
	};
}

const useBaseControlProps = originalUseBaseControlProps || useBaseControlPropsFallback;

// Fallback for the experimental NumberControl component.
const NumberControl = props => {
	if ( __experimentalNumberControl ) {
		return <__experimentalNumberControl { ...props } />;
	}

	const textControlProps = { ...props };
	[
		'spinControls',
		'isPressEnterToChange',
		'isDragEnabled',
		'isShiftStepEnabled',
		'__unstableStateReducer',
	].forEach( key => delete textControlProps[ key ] );

	return <TextControl { ...textControlProps } />;
};

const TimeDivider = ( { char = ':' } ): React.ReactElement => {
	return <span className={ styles[ 'timestamp-control-divider' ] }>{ char }</span>;
};

const CHANGE = 'CHANGE';
const COMMIT = 'COMMIT';
const PRESS_DOWN = 'PRESS_DOWN';
const PRESS_UP = 'PRESS_UP';

const buildPadInputStateReducer = ( pad: number ) => {
	return ( state, action ) => {
		const nextState = { ...state };
		if (
			action.type === COMMIT ||
			action.type === PRESS_UP ||
			action.type === PRESS_DOWN ||
			action.type === CHANGE
		) {
			if ( nextState.value !== undefined ) {
				nextState.value = nextState.value.toString().padStart( pad, '0' );
			}
		}
		return nextState;
	};
};

type TimeDataProps = {
	hh: number;
	mm: number;
	ss: number;
	decimal: number;
};

/**
 * Return the time data based on the given value.
 *
 * @param {number} value                    - The value to be converted.
 * @param {DecimalPlacesProp} decimalPlaces - The number of decimal places to be used.
 * @param {number} max                      - The maximum value.
 * @returns {TimeDataProps}                   The time data.
 */
function getTimeDataByValue(
	value: number,
	decimalPlaces: DecimalPlacesProp,
	max: number
): TimeDataProps {
	if ( value > max ) {
		value = max;
	}

	const valueIsNaN = Number.isNaN( value );

	// Compute decimal part based on the decimalPlaces.
	const decimal =
		valueIsNaN || typeof decimalPlaces === 'undefined'
			? 0
			: Math.floor( ( value % 1000 ) / Number( `1e${ 3 - decimalPlaces }` ) );

	return {
		hh: valueIsNaN ? 0 : Math.floor( ( value / ( 1000 * 60 * 60 ) ) % 24 ),
		mm: valueIsNaN ? 0 : Math.floor( ( value / ( 1000 * 60 ) ) % 60 ),
		ss: valueIsNaN ? 0 : Math.floor( ( value / 1000 ) % 60 ),
		decimal,
	};
}

export const TimestampInput = ( {
	onChange,
	disabled,
	value,
	max,
	autoHideTimeInput = true,
	decimalPlaces,
}: TimestampInputProps ): React.ReactElement => {
	const time = {
		value: getTimeDataByValue( value, decimalPlaces, max ),
	};

	// Check whether it should add hours input.
	const biggerThanOneHour = max > 60 * 60 * 1000;
	const biggerThanOneMinute = max > 60 * 1000;

	const computeTimeValue = ( unit: 'hh' | 'mm' | 'ss' | 'decimal' ) => ( newValue: number ) => {
		if ( typeof newValue === 'string' && ! isNaN( parseInt( newValue, 10 ) ) ) {
			newValue = parseInt( newValue, 10 );
		}

		// Check if the newValue is valid
		if (
			( unit === 'hh' && newValue > 99 ) ||
			( ( unit === 'mm' || unit === 'ss' ) && newValue > 59 ) ||
			( unit === 'decimal' && newValue > Number( `1e${ decimalPlaces }` ) - 1 )
		) {
			return;
		}

		// Last check. If the newValue is not a number, bail out.
		if ( typeof newValue === 'string' ) {
			return;
		}

		// Update time object data.
		time.value = { ...getTimeDataByValue( value, decimalPlaces, max ), [ unit ]: newValue };

		// Call onChange callback.
		const decimalValue = time.value.decimal
			? time.value.decimal * Number( `1e${ 3 - decimalPlaces }` )
			: 0;

		onChange?.(
			( time.value.hh * 3600 + time.value.mm * 60 + time.value.ss ) * 1000 + decimalValue
		);
	};

	return (
		<div
			className={ clsx( styles[ 'timestamp-input-wrapper' ], {
				[ styles[ 'is-disabled' ] ]: disabled,
			} ) }
		>
			{ ( biggerThanOneHour || ! autoHideTimeInput ) && (
				<>
					<NumberControl
						className={ styles[ 'timestamp-control-input' ] }
						disabled={ disabled }
						min={ 0 }
						max={ 99 }
						step={ 1 }
						hideLabelFromVision
						spinControls="none"
						placeholder="00"
						isPressEnterToChange
						isDragEnabled={ false }
						isShiftStepEnabled={ false }
						__unstableStateReducer={ buildPadInputStateReducer( 2 ) }
						value={ String( time.value.hh ).padStart( 2, '0' ) }
						onChange={ computeTimeValue( 'hh' ) }
					/>
					<TimeDivider />
				</>
			) }

			{ ( biggerThanOneMinute || ! autoHideTimeInput ) && (
				<>
					<NumberControl
						className={ styles[ 'timestamp-control-input' ] }
						disabled={ disabled }
						min={ 0 }
						max={ 59 }
						step={ 1 }
						hideLabelFromVision
						spinControls="none"
						placeholder="00"
						isPressEnterToChange
						isDragEnabled={ false }
						isShiftStepEnabled={ false }
						__unstableStateReducer={ buildPadInputStateReducer( 2 ) }
						value={ String( time.value.mm ).padStart( 2, '0' ) }
						onChange={ computeTimeValue( 'mm' ) }
					/>
					<TimeDivider />
				</>
			) }

			<NumberControl
				className={ styles[ 'timestamp-control-input' ] }
				disabled={ disabled }
				min={ 0 }
				max={ 59 }
				step={ 1 }
				hideLabelFromVision
				spinControls="none"
				placeholder="00"
				isPressEnterToChange
				isDragEnabled={ false }
				isShiftStepEnabled={ false }
				__unstableStateReducer={ buildPadInputStateReducer( 2 ) }
				value={ String( time.value.ss ).padStart( 2, '0' ) }
				onChange={ computeTimeValue( 'ss' ) }
			/>

			{ decimalPlaces && (
				<>
					<TimeDivider char="." />
					<NumberControl
						className={ styles[ 'timestamp-control-input' ] }
						style={ { '--input-width': `${ 12 * decimalPlaces }px` } }
						disabled={ disabled }
						min={ 0 }
						max={ Number( '9'.repeat( decimalPlaces ) ) }
						step={ 1 }
						hideLabelFromVision
						spinControls="none"
						placeholder={ '0'.repeat( decimalPlaces ) }
						isPressEnterToChange
						isDragEnabled={ false }
						isShiftStepEnabled={ false }
						__unstableStateReducer={ buildPadInputStateReducer( decimalPlaces ) }
						value={ String( time.value.decimal ).padStart( decimalPlaces, '0' ) }
						onChange={ computeTimeValue( 'decimal' ) }
					/>
				</>
			) }
		</div>
	);
};

/**
 * TimestampControl component
 *
 * @param {TimestampControlProps} props - Component props.
 * @returns {React.ReactElement}          TimestampControl react component.
 */
export const TimestampControl = ( props: TimestampControlProps ): React.ReactElement => {
	const {
		disabled = false,
		min = 0,
		max = Number.MAX_SAFE_INTEGER,
		value,
		onChange,
		onDebounceChange,
		wait = 1000,
		fineAdjustment = 50,
		autoHideTimeInput = true,
		decimalPlaces,
		marksEvery,
		renderTooltip,
	} = props;

	const debounceTimer = useRef< NodeJS.Timeout >();
	const [ controledValue, setControledValue ] = useState( value );

	useEffect( () => {
		setControledValue( value );
	}, [ value ] );

	// Check and add a fallback for the `useBaseControlProps` hook.
	const { baseControlProps } = useBaseControlProps?.( props ) || {};

	const onChangeHandler = useCallback(
		( newValue: number ) => {
			clearTimeout( debounceTimer?.current );

			if ( newValue > max ) {
				newValue = max;
			}

			if ( newValue < min ) {
				newValue = min;
			}

			setControledValue( newValue );
			onChange?.( newValue );
			debounceTimer.current = setTimeout( onDebounceChange?.bind( null, newValue ), wait );
		},
		[ onDebounceChange, onChange, max, min, wait ]
	);

	const marks: Array< { value: number; label: string } > = [];
	if ( marksEvery ) {
		for ( let i = min; i <= max; i += marksEvery ) {
			marks.push( { value: i, label: null } );
		}
	}

	// Provides a default function to render the tooltip content.
	const renderTooltipHandler =
		typeof renderTooltip === 'function' ? renderTooltip : ( time: number ) => formatTime( time );

	return (
		<BaseControl { ...baseControlProps }>
			<div className={ styles[ 'timestamp-control__controls-wrapper' ] }>
				{ NumberControl && (
					<TimestampInput
						disabled={ disabled }
						max={ max }
						value={ controledValue }
						onChange={ onChangeHandler }
						autoHideTimeInput={ autoHideTimeInput }
						decimalPlaces={ decimalPlaces }
					/>
				) }

				<RangeControl
					disabled={ disabled }
					className={ styles[ 'timestamp-range-control' ] }
					min={ min }
					step={ fineAdjustment }
					initialPosition={ controledValue }
					value={ controledValue }
					max={ max }
					withInputField={ false }
					onChange={ onChangeHandler }
					marks={ marksEvery ? marks : undefined }
					renderTooltipContent={ renderTooltipHandler }
					{ ...( renderTooltip === false ? { showTooltip: false } : {} ) }
				/>
			</div>
		</BaseControl>
	);
};

export default TimestampControl;
