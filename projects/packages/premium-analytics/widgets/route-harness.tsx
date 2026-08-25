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
 * Mount a subtree under a real matched `/` route.
 *
 * A widget that hosts its own date controls reads and writes the URL through
 * `useReportDateFilters`, which needs both `useSearch` and `useNavigate` on a
 * live match. Neither Storybook nor the Jest route mock provides that: the
 * shared `withStoryRouter` supplies router *context* only (enough for `Link` to
 * build an href), and `tests/js/route-test-utils.tsx` mocks `useSearch` alone.
 * One real memory router serves both, which is cheaper and more honest than
 * maintaining two fakes.
 *
 * `ReportScopeProvider offersComparison={ false }` mirrors what a `none` section
 * declares in the app. Without it the context default (`true`) would make
 * `DateFiltersPanel` render a comparison control the product does not have.
 *
 * The router is rebuilt only when the initial search changes: calling
 * `createRouter` on every render would remount the subtree and drop the
 * picker's state mid-interaction.
 *
 * @param props          - Component props.
 * @param props.search   - Initial search params for the `/` route.
 * @param props.children - The subtree to mount.
 * @return The subtree under a matched route.
 */
export function RouteHarness( {
	search,
	children,
}: {
	search: Record< string, string >;
	children: ReactNode;
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
				<ReportScopeProvider offersComparison={ false }>{ children }</ReportScopeProvider>
			),
		} );

		return createRouter( {
			routeTree: rootRoute.addChildren( [ indexRoute ] ),
			history: createMemoryHistory( { initialEntries: [ initialEntry ] } ),
			// TanStack's options type requires strictNullChecks, which this package does not enable.
		} as never );
		// `children` is stable for a given mount; rebuilding the router on it would remount.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ initialEntry ] );

	return <RouterProvider router={ router as never } />;
}
