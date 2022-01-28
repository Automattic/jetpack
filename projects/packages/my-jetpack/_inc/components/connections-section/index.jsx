/**
 * External dependencies
 */
import React from 'react';
import { ConnectionStatusCard } from '@automattic/jetpack-connection';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';

/**
 * Plan section component.
 *
 * @returns {object} ConnectionsSection React component.
 */
export default function ConnectionsSection() {
	const { apiRoot, apiNonce, redirectUrl } = useMyJetpackConnection();
	return (
		<ConnectionStatusCard apiRoot={ apiRoot } apiNonce={ apiNonce } redirectUri={ redirectUrl } />
	);
}
