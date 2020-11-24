/**
 * WordPress dependencies
 */
import {
	BaseControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function checkValidValue( val, max ) {
	if ( val > max ) {
		return val = max;
	} else if ( val < 0 ) {
		return val = 0;
	}

	return val;
}

const timeStampMap = [ 'hour', 'min', 'sec' ];

/**
 * Helper function to parse and stringify the time stamp,
 * in the HH:MM:SS format.
 * `HH` is optional, meaning when it's empty,
 * the string won't contain it, returning MM:SS.
 *
 * @param {object} typeValue - { type: value } pair value of the time stamp.
 * @param {Array} smh - current [ second, menute, hour ] array values.
 * @returns {string} HH:MM:SS format.
 */
function setTimeStampValue( typeValue, smh ) {
	if ( smh.length <= 2 ) {
		smh.unshift( '00' );
	}

	const type = Object.keys( typeValue )?.[ 0 ];
	if ( ! type ) {
		return smh.join( ':' );
	}

	let newValue = String( checkValidValue( typeValue[ type ], type === 'hour' ? 23 : 59 ) );

	// Mask HH:MM:SS values.
	if ( newValue?.length === 1 ) {
		newValue = `0${ newValue }`;
	} else if ( newValue?.length === 0 ) {
		newValue = '00';
	}

	smh[ timeStampMap.indexOf( type ) ] = newValue;

	// Remove HH when zero.
	if ( smh.length === 3 && smh[ 0 ] === '00' ) {
		smh.shift();
	}

	return smh.join( ':' );
}

function TimeStamp ( { value, className, onChange } ) {
	const smh = value.split( ':' );
	if ( smh.length <= 2 ) {
		smh.unshift( '00' );
	}

	return (
		<div className={ className }>
			<NumberControl
				className={ `${ className }__hour` }
				label={ __( 'Hour', 'jetpack' ) }
				value={ smh[ 0 ] }
				min={ 0 }
				max={ 23 }
				onChange={ ( hour ) => {
					onChange( setTimeStampValue( { hour }, smh ) );
				} }
			/>

			<NumberControl
				className={ `${ className }__minute` }
				label={ __( 'Minute', 'jetpack' ) }
				value={ smh[ 1 ] }
				min={ 0 }
				max={ 59 }
				onChange={ ( min ) => {
					onChange( setTimeStampValue( { min }, smh ) );
				} }
			/>

			<NumberControl
				className={ `${ className }__second` }
				label={ __( 'Second', 'jetpack' ) }
				value={ smh[ 2 ] }
				min={ 0 }
				max={ 59 }
				onChange={ ( sec ) => {
					onChange( setTimeStampValue( { sec }, smh ) );
				} }
			/>
		</div>
	);
}

export default function TimeStampControl( {
	className,
	value,
	onChange,
} ) {
	return (
		<BaseControl>
			<TimeStamp
				className={ className }
				value={ value }
				onChange={ onChange }
			/>
		</BaseControl>
	);
}
