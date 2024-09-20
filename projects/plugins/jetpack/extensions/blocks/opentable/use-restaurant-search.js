import { useState, useEffect, useCallback } from '@wordpress/element';
import { unionBy, throttle, isEmpty } from 'lodash';

export const possibleEmbed = /^\s*(http[s]?:\/\/|\<script)/;

export default function useRestaurantSearch( searchTerm, maxResults ) {
	const [ restaurants, setRestaurants ] = useState( [] );
	const [ hasRequestFailed, setHasRequestFailed ] = useState( false );

	const searchRestaurants = ( input = '' ) => {
		setHasRequestFailed( false );

		fetch(
			'https://www.opentable.com/widget/reservation/restaurant-search?pageSize=' +
				maxResults +
				'&query=' +
				encodeURIComponent( input )
		)
			.then( result => result.json() )
			.then( restaurantResponse => {
				setHasRequestFailed( false );
				setRestaurants( unionBy( restaurants, restaurantResponse.items, 'rid' ) );
			} )
			.catch( () => setHasRequestFailed( true ) );
	};

	const throttledSearchRestaurants = useCallback( throttle( searchRestaurants, 500 ), [
		restaurants,
	] );

	useEffect( () => {
		if ( ! isEmpty( searchTerm ) && ! possibleEmbed.test( searchTerm ) ) {
			throttledSearchRestaurants( searchTerm );
		}
	}, [ searchTerm ] );

	return { restaurants, hasRequestFailed };
}
