/**
 * External dependencies
 */
import { unionBy, throttle, isEmpty } from 'lodash';

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
				encodeURIComponent( input )
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
		if ( ! isEmpty( searchTerm ) && ! searchTerm.startsWith( '<script' ) ) {
			throttledSearchRestaurants( searchTerm );
		}
	}, [ searchTerm ] );

	return restaurants;
}
