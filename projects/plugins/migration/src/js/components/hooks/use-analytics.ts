import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useConnection } from '@automattic/jetpack-connection';
import { useEffect } from 'react';

const useAnalytics = ( apiRoot: string, apiNonce: string ) => {
	const { isUserConnected, userConnectionData = {} } = useConnection( { apiRoot, apiNonce } );
	const { login, ID } = userConnectionData.currentUser?.wpcomUser || {};

	/**
	 * Initialize tracks with user data.
	 * Should run when we have a connected user.
	 */
	useEffect( () => {
		if ( ! ( isUserConnected && ID && login ) ) {
			return;
		}

		jetpackAnalytics.initialize( ID, login );
	}, [ ID, isUserConnected, login ] );

	return jetpackAnalytics;
};

export default useAnalytics;
