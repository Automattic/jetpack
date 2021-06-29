/**
 * External dependencies
 */
import React, { useMemo } from 'react';

/**
 * WordPress dependencies
 */
import { CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/* eslint-disable react/jsx-no-bind */

const VALID_POST_TYPES = global.JetpackInstantSearchValidPostTypes;
const VALID_POST_TYPE_NAMES = Object.keys( VALID_POST_TYPES );

/**
 * Control for modifying excluded post types.
 *
 * @param {object} props - component properties.
 * @param {boolean} props.disabled - disables the control.
 * @param {Function} props.onChange - invoked with a new color when the selected color has changed.
 * @param {string} props.value - excluded post types as a CSV.
 * @returns {React.Element} component instance
 */
export default function ExcludedPostTypesControl( { disabled, value, onChange } ) {
	const selectedValues = useMemo( () => {
		if ( ! value || typeof value !== 'string' ) {
			return new Set();
		}
		return new Set( value?.split( ',' ) );
	}, [ value ] );
	const changeHandler = key => isSelected => {
		const newValue = new Set( selectedValues );
		isSelected ? newValue.add( key ) : newValue.delete( key );
		onChange( [ ...newValue ].join( ',' ) );
	};

	const isLastUnchecked = selectedValues.size === VALID_POST_TYPE_NAMES.length - 1;
	return (
		<div className="jp-search-customize-excluded-post-types-input">
			<div className="jp-search-customize-excluded-post-types-label">
				{ __( 'Excluded post types', 'jetpack' ) }
			</div>
			{ VALID_POST_TYPE_NAMES.map( type => (
				<CheckboxControl
					checked={ selectedValues.has( type ) }
					disabled={ disabled || ( ! selectedValues.has( type ) && isLastUnchecked ) }
					help={
						! selectedValues.has( type ) &&
						isLastUnchecked &&
						/* translators: for excluded post types control; one post type must remain included. */
						__( 'You must leave at least one post type unchecked.', 'jetpack' )
					}
					key={ type }
					label={ VALID_POST_TYPES[ type ].label }
					onChange={ changeHandler( type ) }
					value={ type }
				/>
			) ) }
		</div>
	);
}
