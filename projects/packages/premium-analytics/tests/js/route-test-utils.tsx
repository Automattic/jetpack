import type { AnchorHTMLAttributes, ReactNode } from 'react';

type RouteSearch =
	| Record< string, unknown >
	| ( ( current: Record< string, unknown > ) => Record< string, unknown > );

type MockRouteLinkProps = {
	to: string;
	params?: Record< string, unknown >;
	search?: RouteSearch;
	children: ReactNode;
} & Omit< AnchorHTMLAttributes< HTMLAnchorElement >, 'href' >;

let currentSearch: Record< string, unknown > = {};

/**
 * Set the search params supplied to route-link updater functions.
 *
 * @param search - Current route search params.
 */
export function setMockRouteSearch( search: Record< string, unknown > = {} ): void {
	currentSearch = search;
}

/**
 * Render a WordPress route link as an anchor for component tests.
 *
 * @param root0          - Link props.
 * @param root0.to       - Destination route pattern.
 * @param root0.params   - Route path params.
 * @param root0.search   - Search params or updater.
 * @param root0.children - Link contents.
 * @return The rendered anchor.
 */
function MockRouteLink( { to, params, search, children, ...props }: MockRouteLinkProps ) {
	const path = Object.entries( params ?? {} ).reduce(
		( currentPath, [ key, value ] ) => currentPath.replace( `$${ key }`, String( value ) ),
		to
	);
	const resolvedSearch = typeof search === 'function' ? search( currentSearch ) : search ?? {};
	const query = new URLSearchParams();

	Object.entries( resolvedSearch ).forEach( ( [ key, value ] ) => {
		if ( value !== undefined && value !== null ) {
			query.set( key, String( value ) );
		}
	} );

	const queryString = query.toString();

	return (
		<a href={ queryString ? `${ path }?${ queryString }` : path } { ...props }>
			{ children }
		</a>
	);
}

/** Shared Jest replacement for the WordPress route module. */
export const mockWordPressRoute = {
	Link: MockRouteLink,
	useSearch: () => currentSearch,
	// Swallows the write. A component under test may hold a hook that commits to
	// the URL, and rendering it must not need a router.
	useNavigate: () => () => {},
};

/**
 * Parse a link rendered by `mockWordPressRoute`.
 *
 * @param link - Rendered link element.
 * @return The parsed link URL.
 */
export function getMockRouteLinkUrl( link: HTMLElement ): URL {
	return new URL( link.getAttribute( 'href' ) ?? '', 'https://example.com' );
}
