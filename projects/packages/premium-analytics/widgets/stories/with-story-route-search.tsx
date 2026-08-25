/**
 * Internal dependencies
 */
import { RouteHarness } from '../route-harness';
import type { Decorator } from '@storybook/react';

/**
 * Mount a story under a real matched `/` route with the given search params.
 *
 * Storybook counterpart of `RouteHarness`; the Jest tests use the harness
 * directly. See its docblock for why a real router is used rather than a mock.
 *
 * @param search - Initial search params for the `/` route.
 * @return A Storybook decorator.
 */
export function withStoryRouteSearch( search: Record< string, string > ): Decorator {
	return Story => (
		<RouteHarness search={ search }>
			<Story />
		</RouteHarness>
	);
}
