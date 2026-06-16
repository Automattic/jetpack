/**
 * External dependencies
 */
import { Stack } from '@wordpress/ui';
import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * Internal dependencies
 */
import { Connect } from './components/connect';
import { ConnectUnavailable } from './components/connect-unavailable';
import './style.scss';

/**
 * Connect route stage component.
 * If connected, the route guard in route.tsx redirects to dashboard.
 */
export const stage = () => {
	const connectionData = getScriptData()?.connection;

	if ( ! connectionData ) {
		return <ConnectUnavailable />;
	}

	return (
		<Stack
			align="center"
			justify="center"
			className="wc-analytics-connect-stage"
		>
			<Connect data={ connectionData } />
		</Stack>
	);
};
