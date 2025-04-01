import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useCallback, useEffect } from 'react';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useMyJetpackConnection from '../use-my-jetpack-connection';

export type TracksEvent = `jetpack_${ string }`; // Enforces the event name to start with "jetpack_"
export type TracksProperties = Record< Lowercase< string >, unknown >; // Defines the shape of the properties object

type TracksRecordEvent = ( event: TracksEvent, properties?: TracksProperties ) => void;

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
	 * @param {string} event      - event name
	 * @param {object} properties - event propeties
	 */
	const recordEvent = useCallback< TracksRecordEvent >( ( event, properties ) => {
		jetpackAnalytics.tracks.recordEvent( event, {
			version: myJetpackVersion,
			is_site_connected: isSiteConnected,
			is_user_connected: isUserConnected,
			referring_plugins: connectedPluginsSlugs,
			...properties,
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return { recordEvent };
};

export default useAnalytics;
