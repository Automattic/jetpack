import { useState, useEffect, useCallback } from '@wordpress/element';
import { unionBy, throttle, isEmpty } from 'lodash';

export const possibleEmbed = /^\s*(http[s]?:\/\/|\<script)/;

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
		if ( ! isEmpty( searchTerm ) && ! possibleEmbed.test( searchTerm ) ) {
			throttledSearchRestaurants( searchTerm );
		}
	}, [ searchTerm ] );

	return restaurants;
}
