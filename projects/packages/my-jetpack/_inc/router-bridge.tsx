import { useNavigate, useParams, useSearch } from '@wordpress/route';
import { useMemo } from 'react';
import { Router, createPath } from 'react-router';
import { getRouteHref } from './utils/route-href';
import type { ReactNode } from 'react';
import type { Navigator, To } from 'react-router';

const toHref = ( to: To ) => ( typeof to === 'string' ? to : createPath( to ) );

/**
 * Runs screens still written against react-router under the boot router, which owns the URL.
 *
 * @param props          - Component props.
 * @param props.children - The screens.
 * @return The bridged tree.
 */
export function RouterBridge( { children }: { children: ReactNode } ) {
	// Subscribed only so each navigation re-renders the tree; the location is read from the URL,
	// which keeps search values as strings instead of the boot router's JSON-parsed ones.
	useParams( { strict: false } as never );
	useSearch( { strict: false } as never );
	const navigate = useNavigate();

	const navigator = useMemo< Navigator >( () => {
		type NavigateOptions = Parameters< typeof navigate >[ 0 ];

		return {
			createHref: to => {
				const url = new URL( window.location.href );
				url.searchParams.set( 'p', toHref( to ) );
				return url.pathname + url.search;
			},
			go: delta => window.history.go( delta ),
			push: to => navigate( { href: toHref( to ) } as NavigateOptions ),
			replace: to => navigate( { href: toHref( to ), replace: true } as NavigateOptions ),
		};
	}, [ navigate ] );

	return (
		<Router location={ getRouteHref() } navigator={ navigator }>
			{ children }
		</Router>
	);
}
