import { ConnectionStatusCard } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';
import React from 'react';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import { STORE_ID } from '../../state/store';

/**
 * Plan section component.
 *
 * @returns {object} ConnectionsSection React component.
 */
export default function ConnectionsSection() {
	const { apiRoot, apiNonce, topJetpackMenuItemUrl, connectedPlugins } = useMyJetpackConnection();
	const navigate = useMyJetpackNavigate( '/connection' );
	const productsThatRequiresUserConnection = useSelect( select =>
		select( STORE_ID ).getProductsThatRequiresUserConnection()
	);

	return (
		<ConnectionStatusCard
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			redirectUri={ topJetpackMenuItemUrl }
			onConnectUser={ navigate }
			connectedPlugins={ connectedPlugins }
			requiresUserConnection={ productsThatRequiresUserConnection.length > 0 }
		/>
	);
}
