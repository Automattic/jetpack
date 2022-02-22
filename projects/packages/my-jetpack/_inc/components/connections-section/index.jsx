/**
 * External dependencies
 */
import React from 'react';
import { ConnectionStatusCard } from '@automattic/jetpack-connection';

/**
 * Internal dependencies
 */
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

/**
 * Plan section component.
 *
 * @returns {object} ConnectionsSection React component.
 */
export default function ConnectionsSection() {
	const { apiRoot, apiNonce, redirectUrl } = useMyJetpackConnection();
	const navigate = useMyJetpackNavigate( '/connection' );
	return (
		<ConnectionStatusCard
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			redirectUri={ redirectUrl }
			onConnectUser={ navigate }
		/>
	);
}
