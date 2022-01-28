/* global myJetpackRest */
/**
 * External dependencies
 */
import { useEffect } from 'react';
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useConnection } from '@automattic/jetpack-connection';

const useAnalytics = () => {
	const { apiRoot, apiNonce } = myJetpackRest;

	const { isUserConnected, userConnectionData } = useConnection( {
		apiRoot,
		apiNonce,
	} );

	const { login, ID } = userConnectionData.currentUser.wpcomUser;
	/**
	 * Initialize tracks with user data.
	 * Should run when we have a connected user.
	 */
	useEffect( () => {
		if ( isUserConnected ) {
			jetpackAnalytics.initialize( ID, login );
		}
	} );
	const {
		clearedIdentity,
		ga,
		mc,
		pageView,
		purchase,
		setGoogleAnalyticsEnabled,
		setMcAnalyticsEnabled,
		setProperties,
		tracks,
	} = jetpackAnalytics;
	return {
		clearedIdentity,
		ga,
		mc,
		pageView,
		purchase,
		setGoogleAnalyticsEnabled,
		setMcAnalyticsEnabled,
		setProperties,
		tracks,
	};
};

export default useAnalytics;
