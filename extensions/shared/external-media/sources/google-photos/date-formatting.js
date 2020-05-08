/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

export function getDateValue( name, value ) {
	if ( name === 'startDate' ) {
		/* translators: %s is formatted date */
		return sprintf( __( 'After %s', 'jetpack' ), value );
	}

	/* translators: %s is formatted date */
	return sprintf( __( 'Before %s', 'jetpack' ), value );
}

export function getDateName( name ) {
	if ( name === 'startDate' ) {
		return __( 'After Date', 'jetpack' );
	}

	return __( 'Before Date', 'jetpack' );
}
