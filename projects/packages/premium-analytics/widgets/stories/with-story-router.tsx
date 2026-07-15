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
const storyRouter = createRouter( {
	routeTree: rootRoute.addChildren( [ reportRoute ] ),
	history: createMemoryHistory( { initialEntries: [ '/' ] } ),
	// TanStack's options type requires strictNullChecks, which this package does not enable.
} as never );

/**
 * Provides the router context that widget footer ReportLinks need in Storybook.
 * The report route lets those links build the same real href shape as the app.
 */
export function StoryRouterProvider( { children }: { children: ReactNode } ) {
	return <RouterContextProvider router={ storyRouter }>{ children }</RouterContextProvider>;
}

export const withStoryRouter: Decorator = Story => (
	<StoryRouterProvider>
		<Story />
	</StoryRouterProvider>
);
