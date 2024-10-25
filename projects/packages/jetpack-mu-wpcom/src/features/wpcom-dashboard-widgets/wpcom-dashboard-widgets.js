import '../../common/public-path';
import React from 'react';
import ReactDOM from 'react-dom/client';
import WpcomSiteManagementWidget from './wpcom-site-management-widget';

const data = typeof window === 'object' ? window.JETPACK_MU_WPCOM_DASHBOARD_WIDGETS : {};

const widgets = [
	{
		id: 'wpcom_site_management_widget_main',
		Widget: WpcomSiteManagementWidget,
	},
];

widgets.forEach( ( { id, Widget } ) => {
	const container = document.getElementById( id );
	if ( container ) {
		const root = ReactDOM.createRoot( container );
		root.render( <Widget { ...data } /> );
	}
} );
