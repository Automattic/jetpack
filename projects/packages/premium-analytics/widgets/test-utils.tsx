/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { QueryClientProvider } from '@tanstack/react-query';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type MockRouteLinkProps = {
	to: string;
	params?: Record< string, unknown >;
	search?: Record< string, unknown >;
	children: ReactNode;
} & Omit< AnchorHTMLAttributes< HTMLAnchorElement >, 'href' >;

function MockRouteLink( { to, params, search, children, ...props }: MockRouteLinkProps ) {
	const path = Object.entries( params ?? {} ).reduce(
		( currentPath, [ key, value ] ) => currentPath.replace( `$${ key }`, String( value ) ),
		to
	);
	const query = new URLSearchParams();
	Object.entries( search ?? {} ).forEach( ( [ key, value ] ) => {
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
	useSearch: () => ( {} ),
};

/** Shared renderHook wrapper using the application's query client. */
export function queryClientWrapper( { children }: { children: ReactNode } ) {
	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}
