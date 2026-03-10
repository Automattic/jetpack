import { getUserConnectionUrl } from '@automattic/jetpack-connection';
import { useCallback } from 'react';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import ConnectionStatusCard from '../connection-status-card';

/**
 * Plan section component.
 *
 * @return ConnectionsSection React component.
 */
export default function ConnectionsSection() {
	const { apiRoot, apiNonce, topJetpackMenuItemUrl, connectedPlugins } = useMyJetpackConnection();
	const { adminUrl } = getMyJetpackWindowInitialState();

	// Handle full site disconnection - redirect to admin
	const onFullyDisconnected = () => {
		if ( adminUrl ) {
			window.location.href = adminUrl;
		} else {
			document?.location?.reload();
		}
	};

	// Handle user unlink only - stay in admin, just reload
	const onUserUnlinked = () => {
		document?.location?.reload();
	};

	const onConnectUser = useCallback( () => {
		window.location.href = getUserConnectionUrl();
	}, [] );
	return (
		<ConnectionStatusCard
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			redirectUri={ topJetpackMenuItemUrl }
			onConnectUser={ onConnectUser }
			connectedPlugins={ connectedPlugins as { name: string; slug: string }[] }
			// eslint-disable-next-line react/jsx-no-bind
			onDisconnected={ onFullyDisconnected }
			// eslint-disable-next-line react/jsx-no-bind
			onUnlinked={ onUserUnlinked }
		/>
	);
}
