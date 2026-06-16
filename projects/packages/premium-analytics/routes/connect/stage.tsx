/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { Connect } from './components/connect';
import { ConnectOffline } from './components/connect-offline';
import { ConnectUnavailable } from './components/connect-unavailable';
import './style.scss';

/**
 * Connect route stage component.
 * If connected, the route guard in route.tsx redirects to dashboard.
 *
 * @return The connect stage.
 */
export const stage = () => {
	const connectionData = getScriptData()?.connection;

	if ( ! connectionData ) {
		return <ConnectUnavailable />;
	}

	// Offline/staging mode forces `jetpack_connect` -> `do_not_allow`, so the
	// authorize button would always 403. Show an informative state instead.
	if ( connectionData.connectionStatus?.offlineMode?.isActive ) {
		return <ConnectOffline />;
	}

	return (
		<Stack align="center" justify="center" className="jetpack-premium-analytics-connect-stage">
			<Connect data={ connectionData } />
		</Stack>
	);
};
