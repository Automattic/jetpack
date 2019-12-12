/**
 * External dependencies
 */
import { unionBy, throttle } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';

export default function useRestaurantSearch( searchTerm, maxResults ) {
	const [ restaurants, setRestaurants ] = useState( [] );

	const searchRestaurants = ( input = '' ) => {
		fetch(
			'https://www.opentable.com/widget/reservation/restaurant-search?pageSize=' +
				maxResults +
				'&query=' +
				input
		)
			.then( result => result.json() )
			.then( restaurantResponse =>
				setRestaurants( unionBy( restaurants, restaurantResponse.items, 'rid' ) )
			);
	};

	const throttledSearchRestaurants = useCallback( throttle( searchRestaurants, 500 ), [
		restaurants,
	] );

	useEffect( () => {
		throttledSearchRestaurants( searchTerm );
	}, [ searchTerm ] );

	return restaurants;
}
