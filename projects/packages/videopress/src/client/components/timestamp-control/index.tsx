/**
 * External dependencies
 */
// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
import { __experimentalNumberControl as NumberControl, RangeControl } from '@wordpress/components';
import { useCallback, useRef } from '@wordpress/element';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
/**
 * Types
 */
import { TimestampInputProps, TimestampControlProps } from './types';
import type React from 'react';

const TimeDivider = (): React.ReactElement => {
	return <span className={ styles[ 'timestamp-control-divider' ] }>:</span>;
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

/**
 * Return the time data based on the given value.
 *
 * @param {number} value - The value to be converted.
 * @returns {object}       The time data.
 */
function getTimeDataByValue( value ) {
	const valueIsNaN = isNaN( value );

	return {
		hh: valueIsNaN ? 0 : Math.floor( ( value / ( 1000 * 60 * 60 ) ) % 24 ),
		mm: valueIsNaN ? 0 : Math.floor( ( value / ( 1000 * 60 ) ) % 60 ),
		ss: valueIsNaN ? 0 : Math.floor( ( value / 1000 ) % 60 ),
	};
}

export const TimestampInput = ( {
	onChange,
	disabled,
	value,
	max,
	autoHideTimeInputs = true,
}: TimestampInputProps ): React.ReactElement => {
	const time = {
		value: getTimeDataByValue( value ),
	};

	// Check whether it should add hours input.
	const biggerThanOneHour = Math.floor( ( max / ( 1000 * 60 * 60 ) ) % 24 );
	const biggerThanOneMinute = Math.floor( ( max / ( 1000 * 60 ) ) % 60 );

	const computeTimeValue = ( unit: string ) => ( newValue: number ) => {
		if ( typeof newValue === 'string' && ! isNaN( parseInt( newValue, 10 ) ) ) {
			newValue = parseInt( newValue, 10 );
		}

		// Check if the newValue is valid
		if (
			( unit === 'hh' && newValue > 99 ) ||
			( ( unit === 'mm' || unit === 'ss' ) && newValue > 59 )
		) {
			return;
		}

		// Last check. If the newValue is not a number, bail out.
		if ( typeof newValue === 'string' ) {
			return;
		}

		// Update time object data.
		time.value = { ...getTimeDataByValue( value ), [ unit ]: newValue };

		// Call onChange callback.
		onChange?.( ( time.value.hh * 3600 + time.value.mm * 60 + time.value.ss ) * 1000 );
	};

	return (
		<div
			className={ classnames( styles[ 'timestamp-input-wrapper' ], {
				[ styles[ 'has-hours' ] ]: biggerThanOneHour > 0 || ! autoHideTimeInputs,
			} ) }
		>
			{ ( biggerThanOneHour > 0 || ! autoHideTimeInputs ) && (
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
						value={ time.value.hh < 10 ? `0${ time.value.hh }` : time.value.hh }
						onChange={ computeTimeValue( 'hh' ) }
					/>
					<TimeDivider />
				</>
			) }

			{ ( biggerThanOneMinute > 0 || ! autoHideTimeInputs ) && (
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
						value={ time.value.mm < 10 ? `0${ time.value.mm }` : time.value.mm }
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
				value={ time.value.ss < 10 ? `0${ time.value.ss }` : time.value.ss }
				onChange={ computeTimeValue( 'ss' ) }
			/>
		</div>
	);
};

/**
 * TimestampControl component
 *
 * @param {TimestampControlProps} props - Component props.
 * @returns {React.ReactElement}          TimestampControl react component.
 */
export const TimestampControl = ( {
	disabled = false,
	max,
	value,
	onChange,
	onDebounceChange,
	wait = 1000,
	fineAdjustment = 50,
	autoHideTimeInputs = true,
}: TimestampControlProps ): React.ReactElement => {
	const debounceTimer = useRef< NodeJS.Timeout >();

	const onChangeHandler = useCallback(
		( newValue: number ) => {
			clearTimeout( debounceTimer?.current );

			onChange?.( newValue );
			debounceTimer.current = setTimeout( onDebounceChange.bind( null, newValue ), wait );
		},
		[ onChange ]
	);

	return (
		<div className={ styles[ 'timestamp-control' ] }>
			<TimestampInput
				disabled={ disabled }
				max={ max }
				value={ value }
				onChange={ onChangeHandler }
				autoHideTimeInputs={ autoHideTimeInputs }
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
	);
};

export default TimestampControl;
