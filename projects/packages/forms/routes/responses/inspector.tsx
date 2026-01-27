/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import * as React from 'react';
/**
 * Internal dependencies
 */
import WpRouteDashboardSearchParamsProvider from '../../src/dashboard/router/wp-route-dashboard-search-params-provider.tsx';
import Response from './response';

/**
 * Inspecto component for the form responses DataViews.
 *
 * @return The stage component.
 */
function Inspector() {
	return (
		<WpRouteDashboardSearchParamsProvider from="/responses/$view">
			<Page showSidebarToggle={ false } hasPadding={ false }>
				<Response />
			</Page>
		</WpRouteDashboardSearchParamsProvider>
	);
}

export { Inspector as inspector };
