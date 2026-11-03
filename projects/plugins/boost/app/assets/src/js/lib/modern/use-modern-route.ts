import { useEffect, useState } from 'react';
import { LOCATION_EVENTS } from '../../../../../../_inc/runtime-contract';
import { resolveRoute } from './routes';
import type { ModernRoute } from './routes';

/**
 * Serialize a route so an unchanged URL doesn't re-render the app. The chassis
 * dispatches its own location event alongside ours, so handlers run twice.
 *
 * @param route - Route to key.
 * @return Stable key for the route.
 */
function routeKey( route: ModernRoute ): string {
	return `${ route.subpage ?? '' }:${ route.tab }`;
}

/**
 * Track the route the modern chassis is showing, normalizing the URL as it goes.
 *
 * @return The current route.
 */
export function useModernRoute(): ModernRoute {
	const [ route, setRoute ] = useState< ModernRoute >( () => resolveRoute().route );

	useEffect( () => {
		const onLocationChange = () => {
			const { route: next, normalizedUrl } = resolveRoute();

			if ( normalizedUrl ) {
				window.history.replaceState( null, '', normalizedUrl );
			}

			setRoute( current => ( routeKey( current ) === routeKey( next ) ? current : next ) );
		};

		LOCATION_EVENTS.forEach( event => window.addEventListener( event, onLocationChange ) );
		onLocationChange();

		return () =>
			LOCATION_EVENTS.forEach( event => window.removeEventListener( event, onLocationChange ) );
	}, [] );

	return route;
}
