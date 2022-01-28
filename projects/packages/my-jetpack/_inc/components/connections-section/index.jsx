/* global myJetpackRest */
/* global myJetpackInitialState */
/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { ConnectionStatusCard } from '@automattic/jetpack-connection';

/**
 * Plan section component.
 *
 * @returns {object} ConnectionsSection React component.
 */
export default function ConnectionsSection() {
	const { apiRoot, apiNonce } = myJetpackRest;
	const redirectAfterDisconnect = useCallback( () => {
		window.location = myJetpackInitialState.topJetpackMenuItemUrl;
	}, [] );
	return (
		<ConnectionStatusCard
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			redirectUri={ myJetpackInitialState.redirectUri }
			onDisconnected={ redirectAfterDisconnect }
		/>
	);
}
