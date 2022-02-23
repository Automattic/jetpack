/**
 * External dependencies
 */
import { useEffect } from 'react';
import jetpackAnalytics from '@automattic/jetpack-analytics';
import useMyJetpackConnection from '../use-my-jetpack-connection';

const useAnalytics = () => {
	const { isUserConnected, userConnectionData = {} } = useMyJetpackConnection();
	const { login, ID } = userConnectionData.currentUser?.wpcomUser || {};

	/**
	 * Initialize tracks with user data.
	 * Should run when we have a connected user.
	 */
	useEffect( () => {
		if ( isUserConnected && ID && login ) {
			jetpackAnalytics.initialize( ID, login );
		}
	}, [ ID, isUserConnected, login ] );

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

	/**
	 * Like tracks.recordEvent but provides specifics to My Jetpack
	 *
	 * @param {string} event       - event name
	 * @param {object} properties  - event propeties
	 */
	const recordMyJetpackEvent = ( event, properties ) => {
		tracks.recordEvent( event, {
			...properties,
			version: window?.myJetpackInitialState?.myJetpackVersion,
		} );
	};

	return {
		clearedIdentity,
		ga,
		mc,
		pageView,
		purchase,
		recordEvent: recordMyJetpackEvent,
		setGoogleAnalyticsEnabled,
		setMcAnalyticsEnabled,
		setProperties,
		tracks,
	};
};

export default useAnalytics;
