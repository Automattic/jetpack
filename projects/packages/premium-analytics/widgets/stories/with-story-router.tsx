/**
 * External dependencies
 */
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterContextProvider,
} from '@tanstack/react-router';
import type { Decorator } from '@storybook/react';
import type { ReactNode } from 'react';

const rootRoute = createRootRoute();
const reportRoute = createRoute( {
	getParentRoute: () => rootRoute,
	path: '/reports/$report',
} );
const postDetailRoute = createRoute( {
	getParentRoute: () => rootRoute,
	path: '/post/$postId',
} );
const storyRouter = createRouter( {
	routeTree: rootRoute.addChildren( [ reportRoute, postDetailRoute ] ),
	history: createMemoryHistory( { initialEntries: [ '/' ] } ),
	// TanStack's options type requires strictNullChecks, which this package does not enable.
} as never );

/**
 * Provides the router context that widget links need in Storybook. The report
 * and post-detail routes let `ReportLink` and `PostTitleLink` build the same
 * real href shapes as the app.
 */
export function StoryRouterProvider( { children }: { children: ReactNode } ) {
	return <RouterContextProvider router={ storyRouter }>{ children }</RouterContextProvider>;
}

export const withStoryRouter: Decorator = Story => (
	<StoryRouterProvider>
		<Story />
	</StoryRouterProvider>
);
