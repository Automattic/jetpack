import { useNavigate, useParams, useSearch } from '@wordpress/route';
import { useMemo } from 'react';
import { Router, parsePath } from 'react-router';
import { fromRouteSearch, toRouteHref } from './utils/route-href';
import type { ReactNode } from 'react';
import type { Navigator, To } from 'react-router';

const toHref = ( to: To ) => toRouteHref( typeof to === 'string' ? parsePath( to ) : to );

/**
 * The boot router's search values, JSON-parsed as it parses them.
 *
 * @return The values by name.
 */
export function useRouteSearch(): Record< string, unknown > {
	// `@wordpress/route` types no route tree, so `from` needs a cast.
	return useSearch( { from: '/$' as never, strict: false } );
}

/**
 * Runs screens still written against react-router under the boot router, which owns the URL.
 *
 * @param props          - Component props.
 * @param props.children - The screens.
 * @return The bridged tree.
 */
export function RouterBridge( { children }: { children: ReactNode } ) {
	const { _splat: splat = '' } = useParams( { from: '/$' as never, strict: false } ) as {
		_splat?: string;
	};
	const search = useRouteSearch();
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
		<Router
			location={ { pathname: `/${ splat }`, search: fromRouteSearch( search ) } }
			navigator={ navigator }
		>
			{ children }
		</Router>
	);
}
