/**
 * External dependencies
 */
import { unionBy, throttle, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect, useCallback } from '@wordpress/element';

export const possibleEmbed = /^\s*(http[s]?:\/\/|\<script)/;

export default function useRestaurantSearch( searchTerm, maxResults ) {
	const [ restaurants, setRestaurants ] = useState( [] );

	const searchRestaurants = ( input = '' ) => {
		const openTableUrl = `https://www.opentable.com/widget/reservation/restaurant-search?pageSize=${ maxResults }&query=${ encodeURIComponent(
			input
		) }`;
		apiFetch( {
			url: openTableUrl,
			headers: {
				'User-Agent': 'Mozilla/5.0 Chrome/96 Safari/537',
				'Content-Type': 'application/json',
			},
		} )
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
