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
		apiFetch( {
			path: '/wpcom/v2/opentable/search',
			method: 'POST',
			data: {
				name: input,
				max_results: maxResults,
			},
		} ).then( restaurantResponse =>
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
