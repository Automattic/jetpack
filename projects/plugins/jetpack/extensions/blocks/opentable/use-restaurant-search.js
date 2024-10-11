import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { unionBy, throttle, isEmpty } from 'lodash';

export const possibleEmbed = /^\s*(http[s]?:\/\/|<script)/;

export default function useRestaurantSearch( searchTerm, maxResults ) {
	const [ restaurants, setRestaurants ] = useState( [] );
	const [ hasRequestFailed, setHasRequestFailed ] = useState( false );

	const searchRestaurants = useCallback(
		( input = '' ) => {
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
		},
		[ restaurants, maxResults ]
	);

	const throttledSearchRestaurants = useMemo(
		() => throttle( searchRestaurants, 500 ),
		[ searchRestaurants ]
	);

	useEffect( () => {
		if ( ! isEmpty( searchTerm ) && ! possibleEmbed.test( searchTerm ) ) {
			throttledSearchRestaurants( searchTerm );
		}
	}, [ searchTerm, throttledSearchRestaurants ] );

	return { restaurants, hasRequestFailed };
}
