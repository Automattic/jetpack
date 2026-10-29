/**
 * External dependencies
 */
import {
	DASHBOARD_PAGE_SLUG,
	DashboardWidgetHostProvider,
} from '@jetpack-premium-analytics/routing';
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router';
import { useHostLinkSearch } from '@jetpack-premium-analytics/widgets-toolkit';
import { createContext, useContext } from 'react';
import type { Decorator } from '@storybook/react';
import type { ReactNode } from 'react';

/*
 * The story is rendered *by* the router, since a widget reading the report
 * window off the URL needs an active match. The root route does it, not the
 * dashboard route: the routes below carry no component, so a link click moving
 * the memory history onto one would otherwise unmount the story.
 */
const storyChildren = createContext< ReactNode >( null );

function StoryRoute() {
	return useContext( storyChildren );
}

const rootRoute = createRootRoute( { component: StoryRoute } );
const dashboardRoute = createRoute( {
	getParentRoute: () => rootRoute,
	path: '/',
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

// The matcher judges action hrefs against the admin page, which the Storybook iframe is not.
const STORY_DOCUMENT_URL = `https://example.com/wp-admin/admin.php?page=${ DASHBOARD_PAGE_SLUG }`;

/**
 * Provides the router context that widget links need in Storybook. The report
 * and post-detail routes let the detail links build the same real href shapes
 * as the app, and the widget host mounts the router link for an action href
 * that targets one of them.
 */
export function StoryRouterProvider( { children }: { children: ReactNode } ) {
	return (
		<storyChildren.Provider value={ children }>
			<DashboardWidgetHostProvider base={ STORY_DOCUMENT_URL } useLinkSearch={ useHostLinkSearch }>
				<RouterProvider router={ storyRouter } />
			</DashboardWidgetHostProvider>
		</storyChildren.Provider>
	);
}

export const withStoryRouter: Decorator = Story => (
	<StoryRouterProvider>
		<Story />
	</StoryRouterProvider>
);
