import '../../common/public-path';
import { __ } from '@wordpress/i18n';
import { createRoot } from 'react-dom/client';
import CelebrateLaunchModal from '../../common/celebrate-launch/celebrate-launch-modal';
import {
	buildStudioSyncConnectUrl,
	takeStudioSyncParams,
} from '../../common/studio-sync/studio-sync-url';
import { wpcomTrackEvent } from '../../common/tracks';
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
		const root = createRoot( container );
		root.render( <Widget { ...data } /> );
	}
} );

const url = new URL( window.location.href );
if ( url.searchParams.has( 'celebrate-launch' ) ) {
	url.searchParams.delete( 'celebrate-launch' );
	window.history.replaceState( null, '', url.toString() );
	const rootElement = document.createElement( 'div' );
	document.body.appendChild( rootElement );
	const root = createRoot( rootElement );
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

// Studio's publish flow lands here once the new site is ready: hand off so Studio connects to it.
const studioSync = takeStudioSyncParams( window.location.href );
if ( studioSync && data.wpcomBlogId ) {
	window.history.replaceState( null, '', studioSync.url );
	const openStudio = click => {
		wpcomTrackEvent( 'calypso_studio_sync_connect_site', {
			click,
			studio_site_id: studioSync.params.studioSiteId,
			blogId: data.wpcomBlogId,
		} );
		window.location.href = buildStudioSyncConnectUrl( {
			...studioSync.params,
			remoteSiteId: data.wpcomBlogId,
		} );
	};
	openStudio( false );

	// The notice must stay up: navigating away dismisses Chrome's "Open Studio?" prompt.
	const container = document.createElement( 'div' );
	const heading = document.querySelector( '#wpbody-content .wrap > h1' );
	if ( heading ) {
		heading.after( container );
	} else {
		document.getElementById( 'wpbody-content' )?.prepend( container );
	}
	createRoot( container ).render(
		<div className="notice notice-info">
			<p>
				{ __(
					'Open WordPress Studio to connect your local site to this one.',
					'jetpack-mu-wpcom'
				) }{ ' ' }
				<button type="button" className="button-link" onClick={ () => openStudio( true ) }>
					{ __( 'Open Studio', 'jetpack-mu-wpcom' ) }
				</button>
			</p>
		</div>
	);
}
