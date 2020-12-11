/**
 * WordPress dependencies
 */
import {
	BaseControl,
	Dropdown,
	Button,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function validateValue( val, max ) {
	return Math.max( 0, Math.min( val, max ) );
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

	let newValue = String( validateValue( typeValue[ type ], type === 'hour' ? 23 : 59 ) );

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

function TimeStamp( { value, className, onChange, shortLabel = false } ) {
	const smh = value.split( ':' );
	if ( smh.length <= 2 ) {
		smh.unshift( '00' );
	}

	return (
		<div className={ `${ className }__timestamp-controls` }>
			<NumberControl
				className={ `${ className }__timestamp-control__hour` }
				label={ shortLabel ? __( 'Hour', 'jetpack' ) : __( 'Hour', 'jetpack' ) }
				value={ smh[ 0 ] }
				min={ 0 }
				max={ 23 }
				onChange={ ( hour ) => {
					onChange( setTimeStampValue( { hour }, smh ) );
				} }
			/>

			<NumberControl
				className={ `${ className }__timestamp-control__minute` }
				label={ shortLabel ? __( 'Min', 'jetpack' ) : __( 'Minute', 'jetpack' ) }
				value={ smh[ 1 ] }
				min={ 0 }
				max={ 59 }
				onChange={ ( min ) => {
					onChange( setTimeStampValue( { min }, smh ) );
				} }
			/>

			<NumberControl
				className={ `${ className }__timestamp-control__second` }
				label={ shortLabel ? __( 'Sec', 'jetpack' ) : __( 'Second', 'jetpack' ) }
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

export function TimeStampDropdown( {
	className,
	value,
	onChange,
	shortLabel,
} ) {
	return (
		<Dropdown
			position="bottom right"
			className={ `${ className }__timestamp-dropdown` }
			contentClassName={ `${ className }__timestamp-content` }
			renderToggle={ ( { onToggle } ) => {
				return (
					<Button
						className={ `${ className }__timestamp` }
						onClick={ onToggle }
					>
						{ value }
					</Button>
				);
			} }
			renderContent={ () => <TimeStamp
				className={ className }
				value={ value }
				onChange={ onChange }
				shortLabel={ shortLabel }
			/> }
		/>
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
