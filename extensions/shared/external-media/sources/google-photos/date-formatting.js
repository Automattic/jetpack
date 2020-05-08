/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

export function getDateValue( name, value ) {
	if ( name === 'startDate' ) {
		return sprintf( __( 'After %s' ), value );
	}

	return sprintf( __( 'Before %s' ), value );
}

export function getDateName( name ) {
	if ( name === 'startDate' ) {
		return __( 'After Date' );
	}

	return __( 'Before Date' );
}
