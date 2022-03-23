/* global myJetpackInitialState */
/**
 * External dependencies
 */
import { useCallback, useEffect } from 'react';
import jetpackAnalytics from '@automattic/jetpack-analytics';
import useMyJetpackConnection from '../use-my-jetpack-connection';

const useAnalytics = () => {
	const { isUserConnected, userConnectionData = {} } = useMyJetpackConnection();
	const { login, ID } = userConnectionData.currentUser?.wpcomUser || {};
	const { connectedPlugins } = myJetpackInitialState;

	/**
	 * Initialize tracks with user data.
	 * Should run when we have a connected user.
	 */
	useEffect( () => {
		if ( isUserConnected && ID && login ) {
			jetpackAnalytics.initialize( ID, login );
		}
	}, [ ID, isUserConnected, login ] );

	// Concatenated plugins slugs in alphabetical order
	const connectedPluginsSlugs = Object.keys( connectedPlugins || {} )
		.sort()
		.join( ',' )
		.replaceAll( 'jetpack-', '' );

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
	const recordMyJetpackEvent = useCallback(
		( event, properties ) => {
			tracks.recordEvent( event, {
				...properties,
				version: window?.myJetpackInitialState?.myJetpackVersion,
				referring_plugins: connectedPluginsSlugs,
			} );
		},
		[ tracks, connectedPluginsSlugs ]
	);

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
