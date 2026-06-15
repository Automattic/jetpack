import restApi from '@automattic/jetpack-api';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useMemo } from '@wordpress/element';
import { OfflineMode } from '../../_inc/client/offline-mode/component';

const getInitialState = () => window.JetpackOfflineModeInitialState || {};

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
