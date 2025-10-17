/**
 * External dependencies
 */
import { ThemeProvider } from '@automattic/jetpack-components';
import {
	createRouter,
	createHashHistory,
	RouterProvider,
	createRootRoute,
	createRoute,
} from '@tanstack/react-router';
import { createRoot } from '@wordpress/element';
/**
 * Internal dependencies
 */
import About from './about';
import Layout from './components/layout';
import Inbox from './inbox';
import Integrations from './integrations';
import DashboardNotices from './notices-list';
import './store'; // Register the store
import './style.scss';

declare global {
	interface Window {
		jetpackFormsInit?: () => void;
	}
}

// Export components for use in external apps
export { Layout, Inbox, About, Integrations, DashboardNotices };

// Create route tree for TanStack Router
const rootRoute = createRootRoute( {
	component: Layout,
} );

const indexRoute = createRoute( {
	getParentRoute: () => rootRoute,
	path: '/',
	component: Inbox,
} );

const responsesRoute = createRoute( {
	getParentRoute: () => rootRoute,
	path: '/responses',
	component: Inbox,
} );

const integrationsRoute = createRoute( {
	getParentRoute: () => rootRoute,
	path: '/integrations',
	component: Integrations,
} );

const aboutRoute = createRoute( {
	getParentRoute: () => rootRoute,
	path: '/about',
	component: About,
} );

const routeTree = rootRoute.addChildren( [
	indexRoute,
	responsesRoute,
	integrationsRoute,
	aboutRoute,
] );

let isInitialized = false;

/**
 * Initialize Forms app - can be called externally or by standalone Jetpack
 *
 * @param {object}      options           - Configuration options
 * @param {HTMLElement} options.container - DOM element to mount into
 */
export function initFormsApp( { container } ) {
	if ( isInitialized ) {
		return;
	}

	if ( ! container ) {
		return;
	}

	isInitialized = true;

	// Create router with hash history
	// @ts-expect-error - TanStack Router requires strictNullChecks but we can't enable it yet due to shared package errors
	const router = createRouter( {
		routeTree,
		history: createHashHistory(),
	} );

	const root = createRoot( container );

	root.render(
		<ThemeProvider>
			<RouterProvider router={ router } />
			<DashboardNotices />
		</ThemeProvider>
	);
}

/**
 * Initialize the Forms dashboard
 */
function jetpackFormsInit() {
	const container = document.getElementById( 'jp-forms-dashboard' );

	if ( ! container ) {
		return;
	}

	initFormsApp( { container } );
}

// Export for programmatic initialization
window.jetpackFormsInit = jetpackFormsInit;

// Standalone initialization
window.addEventListener( 'load', jetpackFormsInit );
