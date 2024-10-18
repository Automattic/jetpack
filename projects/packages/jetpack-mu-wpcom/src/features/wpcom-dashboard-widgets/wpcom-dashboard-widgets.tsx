import '../../common/public-path';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from '../../common/components/error-boundary';
import WpcomLaunchpadWidget from './wpcom-launchpad-widget';
import WpcomSiteManagementWidget from './wpcom-site-management-widget';

const renderWidgets = () => {
	// Initialize configData.
	window.configData = window.configData || {};

	const widgets = [
		{
			id: 'wpcom_site_management_widget_main',
			Widget: WpcomSiteManagementWidget,
		},
		{
			id: 'wpcom_launchpad_widget_main',
			Widget: WpcomLaunchpadWidget,
		},
	];

	const queryClient = new QueryClient();

	widgets.forEach( ( { id, Widget } ) => {
		const container = document.getElementById( id );
		if ( container ) {
			const root = ReactDOM.createRoot( container );
			root.render(
				<ErrorBoundary>
					<QueryClientProvider client={ queryClient }>
						<Widget { ...window.wpcomDashboardWidgetsData } />
					</QueryClientProvider>
				</ErrorBoundary>
			);
		}
	} );
};

if ( typeof window !== 'undefined' ) {
	renderWidgets();
}
