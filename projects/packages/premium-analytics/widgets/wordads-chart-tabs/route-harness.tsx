/**
 * External dependencies
 */
import { ReportScopeProvider } from '@jetpack-premium-analytics/data';
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router';
import { useMemo, type ReactNode } from 'react';

/**
 * Mount a subtree under a matched `/` route.
 *
 * This is local to its only consumer. If another widget needs it, lift it to
 * `widgets/` and teach the shared story router to match `/`.
 *
 * URL-backed controls need a live match for both search and navigation;
 * Storybook's router context and the Jest route mock do not provide both.
 *
 * Comparison defaults to the app context default. Pass `false` to model a
 * section that disables it.
 *
 * @param props                  - Component props.
 * @param props.search           - Initial search params for the `/` route.
 * @param props.children         - The subtree to mount.
 * @param props.offersComparison - What the hosting section declares.
 * @return The subtree under a matched route.
 */
export function RouteHarness( {
	search,
	children,
	offersComparison = true,
}: {
	search: Record< string, string >;
	children: ReactNode;
	offersComparison?: boolean;
} ) {
	const initialEntry = useMemo( () => {
		const query = new URLSearchParams( search ).toString();
		return query ? `/?${ query }` : '/';
	}, [ search ] );

	const router = useMemo( () => {
		const rootRoute = createRootRoute();
		const indexRoute = createRoute( {
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => (
				<ReportScopeProvider offersComparison={ offersComparison }>
					{ children }
				</ReportScopeProvider>
			),
		} );

		return createRouter( {
			routeTree: rootRoute.addChildren( [ indexRoute ] ),
			history: createMemoryHistory( { initialEntries: [ initialEntry ] } ),
			// TanStack's options type requires strictNullChecks, which this package does not enable.
		} as never );
		// Excluding the freshly-created `children` avoids remounting the router on every
		// render. Callers changing children must also change search or remount the harness.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ initialEntry, offersComparison ] );

	return <RouterProvider router={ router as never } />;
}
