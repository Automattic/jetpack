/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { Dropdown, Button, RangeControl } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import NumberControl from '../../../shared/components/number-control';
import { convertSecondsToTimeCode, convertTimeCodeToSeconds } from '../../../shared/components/media-player-control/utils';

function validateValue( val, max ) {
	return Math.max( 0, Math.min( val, max ) );
}

const timestampMap = [ 'hour', 'min', 'sec' ];

/**
 * Helper function to parse and stringify the timestamp,
 * in the HH:MM:SS format.
 * `HH` is optional, meaning when it's empty,
 * the string won't contain it, returning MM:SS.
 *
 * @param {object} typeValue - { type: value } pair value of the timestamp.
 * @param {Array} smh - current [ second, menute, hour ] array values.
 * @returns {string} HH:MM:SS format.
 */
function setTimestampValue( typeValue, smh ) {
	const type = Object.keys( typeValue )?.[ 0 ];
	if ( ! type ) {
		return smh.join( ':' );
	}

	let newValue = String( validateValue( typeValue[ type ], type === 'hour' ? 23 : 59 ) );

	// Mask HH:MM:SS values.
	if ( newValue?.length === 1 ) {
		newValue = `0${ newValue }`;
	} else if ( newValue?.length === 0 ) {
		newValue = '00';
	}

	smh[ timestampMap.indexOf( type ) ] = newValue;

	// Remove HH when zero.
	if ( smh.length === 3 && smh[ 0 ] === '00' ) {
		smh.shift();
	}

	return smh.join( ':' );
}

const debouncedSetAttributes = debounce( function ( time, onChange ) {
	onChange( convertSecondsToTimeCode( time ) );
}, 250 );

export function TimestampControl( {
	value,
	className,
	onChange,
	shortLabel = false,
	isDisabled = false,
	duration,
} ) {
	const [ rangeValue, setRangeValue ] = useState( convertTimeCodeToSeconds( value ) );

	const smh = value.split( ':' );
	if ( smh.length <= 2 ) {
		smh.unshift( '00' );
	}

	return (
		<>
			<div className={ `${ className }__timestamp-controls` }>
				<NumberControl
					className={ `${ className }__timestamp-control__hour` }
					label={	shortLabel
						? _x( 'Hour', 'hour (short form)', 'jetpack' )
						: _x( 'Hour', 'hour (long form)', 'jetpack' )
					}
					value={ smh[ 0 ] }
					min={ 0 }
					max={ 23 }
					onChange={ hour => (
						! isDisabled && onChange( setTimestampValue( { hour }, smh ) )
					) }
					disabled={ isDisabled }
				/>

				<NumberControl
					className={ `${ className }__timestamp-control__minute` }
					label={
						shortLabel ? _x( 'Min', 'Short for Minute', 'jetpack' ) : __( 'Minute', 'jetpack' )
					}
					value={ smh[ 1 ] }
					min={ 0 }
					max={ 59 }
					onChange={ min => (
						! isDisabled && onChange( setTimestampValue( { min }, smh ) )
					) }
					disabled={ isDisabled }
				/>

				<NumberControl
					className={ `${ className }__timestamp-control__second` }
					label={
						shortLabel ? _x( 'Sec', 'Short for Second', 'jetpack' ) : __( 'Second', 'jetpack' )
					}
					value={ smh[ 2 ] }
					min={ 0 }
					max={ 59 }
					onChange={ sec => (
						! isDisabled && onChange( setTimestampValue( { sec }, smh ) )
					) }
					disabled={ isDisabled }
				/>
			</div>

			<RangeControl
				disabled={ typeof duration === 'undefined' }
				value={ rangeValue }
				className={ `${ className }__timestamp-range-control` }
				min={ 0 }
				max={ duration }
				onChange={ ( timeInSeconds ) => {
					setRangeValue( timeInSeconds );
					debouncedSetAttributes( timeInSeconds, onChange );
				} }
				withInputField={ false }
				renderTooltipContent={ ( time ) => convertSecondsToTimeCode( time ) }
			/>
		</>
	);
}

export function TimestampDropdown( props ) {
	const { className, value } = props;

	return (
		<Dropdown
			position="bottom right"
			className={ `${ className }__timestamp-dropdown` }
			contentClassName={ `${ className }__timestamp-content` }
			renderToggle={ ( { onToggle } ) => {
				return (
					<Button className={ `${ className }__timestamp` } onClick={ onToggle }>
						{ value }
					</Button>
				);
			} }
			renderContent={ () => (
				<TimestampControl { ...props } />
			) }
		/>
	);
}

export function TimestampEditControl( {
	className,
	isSelected,
	show,
	value,
	mediaCurrentTime = 0,

	onChange,
	onToggle,
	onPlayback,
} ) {
	function TimestampButton() {
		return (
			<Button
				className={ `${ className }__timestamp-label` }
				isTertiary
				onClick={ () => onPlayback( convertTimeCodeToSeconds( value ) ) }
			>
				{ value }
			</Button>
		);
	}

	if ( ! isSelected ) {
		if ( ! show ) {
			return null;
		}

		return <TimestampButton />;
	}

	function ToggleButton( { label } ) {
		return (
			<Button
				className={ `${ className }__timestamp-button` }
				isSmall
				isTertiary
				onClick={ () => {
					onToggle( ! show );
					if ( ! show ) {
						onChange( convertSecondsToTimeCode( mediaCurrentTime ), onChange );
					}
				} }
			>
				{ label }
			</Button>
		);
	}

	if ( ! show ) {
		return <ToggleButton label={ __( 'Add timestamp', 'jetpack' ) } />;
	}

	return (
		<>
			<TimestampButton />
			<ToggleButton label={ __( 'Remove', 'jetpack' ) } />
		</>
	);
}
