/* global myJetpackRest */
/**
 * External dependencies
 */
import React from 'react';
import { ConnectionStatusCard } from '@automattic/jetpack-connection';

/**
 * Plan section component.
 *
 * @returns {object} ConnectionsSection React component.
 */
export default function ConnectionsSection() {
	return (
		<ConnectionStatusCard apiRoot={ myJetpackRest.apiRoot } apiNonce={ myJetpackRest.apiNonce } />
	);
}
