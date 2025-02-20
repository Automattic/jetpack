import '../../common/public-path';
import React from 'react';
import ReactDOM from 'react-dom/client';
import CelebrateLaunchModal from './celebrate-launch/celebrate-launch-modal';
import WpcomDailyWritingPrompt from './wpcom-daily-writing-prompt';
import WpcomGeneralTasksWidget from './wpcom-general-tasks-widget';
import WpcomLaunchpadWidget from './wpcom-launchpad-widget';
import WpcomSiteManagementWidget from './wpcom-site-management-widget';
const data = typeof window === 'object' ? window.JETPACK_MU_WPCOM_DASHBOARD_WIDGETS : {};

const widgets = [
	{
		id: 'wpcom_launchpad_widget_main',
		Widget: WpcomLaunchpadWidget,
	},
	{
		id: 'wpcom_daily_writing_prompt_main',
		Widget: WpcomDailyWritingPrompt,
	},
	{
		id: 'wpcom_site_preview_widget_main',
		Widget: WpcomSiteManagementWidget,
	},
	{
		id: 'wpcom_general_tasks_widget_main',
		Widget: WpcomGeneralTasksWidget,
	},
];

widgets.forEach( ( { id, Widget } ) => {
	const container = document.getElementById( id );
	if ( container ) {
		const root = ReactDOM.createRoot( container );
		root.render( <Widget { ...data } /> );
	}
} );

const url = new URL( window.location.href );
if ( url.searchParams.has( 'celebrate-launch' ) ) {
	url.searchParams.delete( 'celebrate-launch' );
	window.history.replaceState( null, '', url.toString() );
	const rootElement = document.createElement( 'div' );
	document.body.appendChild( rootElement );
	const root = ReactDOM.createRoot( rootElement );
	root.render(
		<CelebrateLaunchModal
			{ ...data }
			onRequestClose={ () => {
				root.unmount();
				rootElement.remove();
			} }
		/>
	);
}
