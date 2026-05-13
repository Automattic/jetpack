import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import * as WPElement from '@wordpress/element';
import { StrictMode } from 'react';
import { createHashRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import CriticalCssProvider from '$features/critical-css/critical-css-context/critical-css-context-provider';
import { NoticeProvider } from '$features/notice/context';
import NoticeManager from '$features/notice/manager';
import Main from './main';
import Index from './pages/index';
import AdvancedCriticalCss from './pages/critical-css-advanced/critical-css-advanced';
import CacheDebugLog from './pages/cache-debug-log/cache-debug-log';
import '../css/admin-style.scss';

const TAB_MOUNT_ID = 'jb-settings-tab-mount';
const LEGACY_ROOT_ID = 'jb-admin-settings';
const CHASSIS_APP_ID = 'jetpack-boost-dashboard-wp-admin-app';

const tabMountRouter = createHashRouter( [
	{
		path: '*',
		element: (
			<NoticeProvider>
				<CriticalCssProvider>
					<Index />
					<NoticeManager />
				</CriticalCssProvider>
			</NoticeProvider>
		),
	},
	{
		path: '/cache-debug-log',
		element: <CacheDebugLog />,
	},
	{
		path: '/critical-css-advanced',
		element: (
			<NoticeProvider>
				<CriticalCssProvider>
					<AdvancedCriticalCss />
					<NoticeManager />
				</CriticalCssProvider>
			</NoticeProvider>
		),
	},
] );

const renderTabMount = ( target: HTMLElement ) => {
	WPElement.createRoot( target ).render(
		<StrictMode>
			<DataSyncProvider>
				<RouterProvider router={ tabMountRouter } />
			</DataSyncProvider>
		</StrictMode>
	);
};

/**
 * Wait for the wp-build chassis to insert the Settings tab mount-point
 * before mounting. The chassis renders the panel asynchronously after
 * its bundle hydrates, so the element doesn't exist when this script's
 * first pass runs at footer load.
 * @param done
 */
const waitForTabMount = ( done: ( target: HTMLElement ) => void ) => {
	const existing = document.getElementById( TAB_MOUNT_ID );
	if ( existing !== null ) {
		done( existing );
		return;
	}

	const observer = new MutationObserver( () => {
		const target = document.getElementById( TAB_MOUNT_ID );
		if ( target !== null ) {
			observer.disconnect();
			done( target );
		}
	} );

	observer.observe( document.body, { childList: true, subtree: true } );
};

/**
 * Initial render function.
 *
 * Three modes, picked at boot:
 *
 * 1. Modernized (chassis present, legacy root absent) — wait for the
 *    chassis's `#jb-settings-tab-mount` div to appear, then render a
 *    slim hash router (no chassis chrome) into it. Skips `SettingsPage`'s
 *    `BoostAdminPage`, `SpeedScore`, `Tips`, `Support` — those belong
 *    to the chassis. Hash routing coexists with the chassis's search-
 *    param routing (`?tab=...`); the two never collide.
 * 2. Legacy (`#jb-admin-settings` present) — falls through to the full
 *    `<Main />` (hash router + SettingsPage chrome) when the
 *    modernization filter is off.
 * 3. Neither root — no-op (page isn't ours).
 */
function render() {
	const legacyContainer = document.getElementById( LEGACY_ROOT_ID );
	if ( legacyContainer !== null ) {
		WPElement.createRoot( legacyContainer ).render( <Main /> );
		return;
	}

	const isChassisPage = document.getElementById( CHASSIS_APP_ID );
	if ( isChassisPage === null ) {
		return;
	}

	waitForTabMount( renderTabMount );
}

render();
