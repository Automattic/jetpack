import restApi from '@automattic/jetpack-api';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useMemo } from '@wordpress/element';
import { OfflineMode } from '../../_inc/client/offline-mode/component';

/**
 * Gets the initial state injected by wp-admin.
 *
 * @return {object} Initial Offline Mode state.
 */
const getInitialState = () => window.JetpackOfflineModeInitialState || {};

/**
 * Configures the Jetpack REST client and api-fetch middleware.
 *
 * @param {string} apiRoot  - REST API root.
 * @param {string} apiNonce - REST API nonce.
 */
function configureRestApi( apiRoot, apiNonce ) {
	if ( apiRoot ) {
		restApi.setApiRoot( apiRoot );

		if ( apiFetch.createRootURLMiddleware ) {
			apiFetch.use( apiFetch.createRootURLMiddleware( apiRoot ) );
		}
	}

	if ( apiNonce ) {
		restApi.setApiNonce( apiNonce );

		if ( apiFetch.createNonceMiddleware ) {
			apiFetch.use( apiFetch.createNonceMiddleware( apiNonce ) );
		}
	}
}

/**
 * Offline Mode admin stage.
 *
 * @return {import('react').ReactElement} Offline Mode page.
 */
function Stage() {
	const { apiNonce = '', apiRoot = '' } = getInitialState();
	const moduleActions = useMemo(
		() => ( {
			activateModule: module => restApi.activateModule( module ),
			deactivateModule: module => restApi.deactivateModule( module ),
			fetchModules: () => restApi.fetchModules(),
		} ),
		[]
	);

	useEffect( () => {
		configureRestApi( apiRoot, apiNonce );
	}, [ apiNonce, apiRoot ] );

	return <OfflineMode apiNonce={ apiNonce } apiRoot={ apiRoot } { ...moduleActions } />;
}

export { Stage as stage };
