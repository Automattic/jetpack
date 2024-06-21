import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useCallback, useEffect } from 'react';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useMyJetpackConnection from '../use-my-jetpack-connection';

type TracksRecordEvent = (
	event: `jetpack_${ string }`, // Enforces the event name to start with "jetpack_"
	properties?: Record< string, unknown >
) => void;

const useAnalytics = () => {
	const {
		isUserConnected,
		isSiteConnected,
		connectedPlugins,
		userConnectionData = {},
	} = useMyJetpackConnection();
	const { login, ID } = userConnectionData.currentUser?.wpcomUser || {};
	const { myJetpackVersion = '' } = getMyJetpackWindowInitialState();

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

	/**
	 * Like tracks.recordEvent but provides specifics to My Jetpack
	 *
	 * @param {string} event       - event name
	 * @param {object} properties  - event propeties
	 */
	const recordEvent = useCallback< TracksRecordEvent >( ( event, properties ) => {
		jetpackAnalytics.tracks.recordEvent( event, {
			...properties,
			version: myJetpackVersion,
			isSiteConnected,
			isUserConnected,
			referring_plugins: connectedPluginsSlugs,
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return { recordEvent };
};

export default useAnalytics;
