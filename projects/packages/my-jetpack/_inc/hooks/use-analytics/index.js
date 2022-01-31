/**
 * External dependencies
 */
import { useEffect } from 'react';
import jetpackAnalytics from '@automattic/jetpack-analytics';
import useMyJetpackConnection from '../use-my-jetpack-connection';

const useAnalytics = () => {
	const { isUserConnected, userConnectionData } = useMyJetpackConnection();
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
