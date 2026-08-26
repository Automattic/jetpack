/**
 * External dependencies
 */
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router';
import { createContext, useContext } from 'react';
import type { Decorator } from '@storybook/react';
import type { ReactNode } from 'react';

/*
 * The story's own tree, handed to the dashboard route's component. A widget that
 * reads the report window off the URL needs an active match to read it from, and
 * a match exists only for a route the router actually renders — so the story is
 * rendered *as* the dashboard route rather than beside it.
 */
const storyChildren = createContext< ReactNode >( null );

function StoryRoute() {
	return useContext( storyChildren );
}

const rootRoute = createRootRoute();
const dashboardRoute = createRoute( {
	getParentRoute: () => rootRoute,
	path: '/',
	component: StoryRoute,
} );
const reportRoute = createRoute( {
	getParentRoute: () => rootRoute,
	path: '/reports/$report',
} );
const postDetailRoute = createRoute( {
	getParentRoute: () => rootRoute,
	path: '/post/$postId',
} );
const storyRouter = createRouter( {
	routeTree: rootRoute.addChildren( [ dashboardRoute, reportRoute, postDetailRoute ] ),
	history: createMemoryHistory( { initialEntries: [ '/' ] } ),
	// TanStack's options type requires strictNullChecks, which this package does not enable.
} as never );

/**
 * Provides the router context that widget links need in Storybook. The report
 * and post-detail routes let `ReportLink` and `PostTitleLink` build the same
 * real href shapes as the app.
 */
export function StoryRouterProvider( { children }: { children: ReactNode } ) {
	return (
		<storyChildren.Provider value={ children }>
			<RouterProvider router={ storyRouter } />
		</storyChildren.Provider>
	);
}

export const withStoryRouter: Decorator = Story => (
	<StoryRouterProvider>
		<Story />
	</StoryRouterProvider>
);
