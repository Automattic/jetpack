/**
 * External dependencies
 */
import {
	// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
	__experimentalNumberControl as NumberControl,
	RangeControl,
	BaseControl,
	useBaseControlProps,
} from '@wordpress/components';
import { useCallback, useRef } from '@wordpress/element';
import classNames from 'classnames';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
/**
 * Types
 */
import { TimestampInputProps, TimestampControlProps, DecimalPlacesProp } from './types';
import type React from 'react';

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
 * @returns {TimeDataProps}                   The time data.
 */
function getTimeDataByValue( value: number, decimalPlaces: DecimalPlacesProp ): TimeDataProps {
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
		value: getTimeDataByValue( value, decimalPlaces ),
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
		time.value = { ...getTimeDataByValue( value, decimalPlaces ), [ unit ]: newValue };

		// Call onChange callback.
		onChange?.(
			( time.value.hh * 3600 + time.value.mm * 60 + time.value.ss ) * 1000 +
				time.value.decimal * Number( `1e${ 3 - decimalPlaces }` )
		);
	};

	return (
		<div
			className={ classNames( styles[ 'timestamp-input-wrapper' ], {
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
		max,
		value,
		onChange,
		onDebounceChange,
		wait = 1000,
		fineAdjustment = 50,
		autoHideTimeInput = true,
		decimalPlaces,
	} = props;

	const debounceTimer = useRef< NodeJS.Timeout >();

	const { baseControlProps } = useBaseControlProps( props );

	const onChangeHandler = useCallback(
		( newValue: number ) => {
			clearTimeout( debounceTimer?.current );

			onChange?.( newValue );
			debounceTimer.current = setTimeout( onDebounceChange?.bind( null, newValue ), wait );
		},
		[ onChange ]
	);

	return (
		<BaseControl { ...baseControlProps }>
			<div className={ styles[ 'timestamp-control__controls-wrapper' ] }>
				<TimestampInput
					disabled={ disabled }
					max={ max }
					value={ value }
					onChange={ onChangeHandler }
					autoHideTimeInput={ autoHideTimeInput }
					decimalPlaces={ decimalPlaces }
				/>

				<RangeControl
					disabled={ disabled }
					className={ styles[ 'timestamp-range-control' ] }
					min={ 0 }
					step={ fineAdjustment }
					initialPosition={ value }
					value={ value }
					max={ max }
					showTooltip={ false }
					withInputField={ false }
					onChange={ onChangeHandler }
				/>
			</div>
		</BaseControl>
	);
};

export default TimestampControl;
