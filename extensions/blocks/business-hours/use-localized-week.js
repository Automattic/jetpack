/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function useLocalizedWeek( days ) {
	const [ daysOfWeek, setDaysOfWeek ] = useState( {
		days: {
			Sun: __( 'Sunday', 'jetpack' ),
			Mon: __( 'Monday', 'jetpack' ),
			Tue: __( 'Tuesday', 'jetpack' ),
			Wed: __( 'Wednesday', 'jetpack' ),
			Thu: __( 'Thursday', 'jetpack' ),
			Fri: __( 'Friday', 'jetpack' ),
			Sat: __( 'Saturday', 'jetpack' ),
		},
		startOfWeek: 0,
	} );

	const [ hasFetched, setHasFetched ] = useState( false );

	useEffect( () => {
		apiFetch( { path: '/wpcom/v2/business-hours/localized-week' } ).then(
			data => {
				setDaysOfWeek( data );
				setHasFetched( true );
			},
			() => setHasFetched( true )
		);
	}, [ hasFetched ] );

	const localizedWeek = days.concat( days.slice( 0, daysOfWeek ) ).slice( daysOfWeek );

	return { hasFetched, localizedWeek, daysOfWeek };
}
