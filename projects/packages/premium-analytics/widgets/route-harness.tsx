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
 * `offersComparison` defaults to what the app's context defaults to, so a
 * subtree that suppresses comparison itself is seen doing it rather than
 * inheriting it from the harness. Pass `false` to stand in for a section that
 * declares no comparison.
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
		// Keyed on the search string alone: `children` is deliberately excluded, because
		// it is a fresh element on every render and including it would rebuild the router
		// each time, remounting the subtree and dropping the picker's state mid-interaction.
		// The contract this places on callers: do not re-render with different `children`
		// while `search` stays the same — the route component would keep rendering the
		// original `children` and the update would be lost silently. Change the search too,
		// or mount a fresh harness.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ initialEntry, offersComparison ] );

	return <RouterProvider router={ router as never } />;
}
