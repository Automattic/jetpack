import restApi from '@automattic/jetpack-api';
import { useEffect } from 'react';

/**
 * Initialize the Jetpack REST API client with the given root and nonce.
 *
 * Shared by the connection dialogs, which each need to configure the singleton
 * `restApi` client before making requests.
 *
 * @param {string} apiRoot  - The REST API root URL.
 * @param {string} apiNonce - The REST API nonce.
 */
export default function useRestApiInit( apiRoot: string, apiNonce: string ): void {
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );
}
