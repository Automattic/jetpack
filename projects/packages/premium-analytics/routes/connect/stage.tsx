/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { Connect } from './components/connect';
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

	return (
		<Stack align="center" justify="center" className="jetpack-premium-analytics-connect-stage">
			<Connect data={ connectionData } />
		</Stack>
	);
};
