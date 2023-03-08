/**
 * External dependencies
 */
// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
import { __experimentalNumberControl as NumberControl, RangeControl } from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';
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

export const TimestampInput = ( {
	value,
	max,
	onChange,
}: TimestampInputProps ): React.ReactElement => {
	const valueIsNaN = isNaN( value );

	const time = {
		value: {
			hh: valueIsNaN ? 0 : Math.floor( ( value / ( 1000 * 60 * 60 ) ) % 24 ),
			mm: valueIsNaN ? 0 : Math.floor( ( value / ( 1000 * 60 ) ) % 60 ),
			ss: valueIsNaN ? 0 : Math.floor( ( value / 1000 ) % 60 ),
		},
	};

	// Check whether it should add hours input.
	const hasHours = Math.floor( ( max / ( 1000 * 60 * 60 ) ) % 24 );

	const computeTimeValue = useCallback(
		( unit: string ) => ( newValue: number ) => {
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
			time.value = { ...time.value, [ unit ]: newValue };

			// Call onChange callback.
			onChange?.( ( time.value.hh * 3600 + time.value.mm * 60 + time.value.ss ) * 1000 );
		},
		[]
	);

	return (
		<div
			className={ classnames( styles[ 'timestamp-input-wrapper' ], {
				[ styles[ 'has-hours' ] ]: hasHours > 0,
			} ) }
		>
			{ hasHours > 0 && (
				<>
					<NumberControl
						className={ styles[ 'timestamp-control-input' ] }
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

			<NumberControl
				className={ styles[ 'timestamp-control-input' ] }
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

			<NumberControl
				className={ styles[ 'timestamp-control-input' ] }
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
	max,
	value,
	onChange,
	onDebounceChange,
	wait = 1000,
}: TimestampControlProps ): React.ReactElement => {
	const debouncedOnChangeHandler = onDebounceChange ? useDebounce( onDebounceChange, wait ) : null;

	const onChangeHandler = useCallback(
		( newValue: number ) => {
			debouncedOnChangeHandler && debouncedOnChangeHandler( newValue );
			onChange( newValue );
		},
		[ onChange, debouncedOnChangeHandler ]
	);

	return (
		<div className={ styles[ 'timestamp-control' ] }>
			<TimestampInput max={ max } value={ value } onChange={ onChangeHandler } />

			<RangeControl
				className={ styles[ 'timestamp-control-range' ] }
				min={ 0 }
				step={ 0.1 }
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
