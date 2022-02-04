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

/**
 * Custom hook to record event on view.
 * In other words, when the user views the page,
 * in other words, when the component is rendered.
 *
 * @param {string} eventName       - The name of the event to record.
 * @param {object} eventProperties - The properties of the event to record.
 */
export function useRecordEventOnView( eventName, eventProperties ) {
	const {
		tracks: { recordEvent },
	} = useAnalytics();

	useEffect( () => {
		recordEvent( eventName, eventProperties );
	}, [ recordEvent, eventName, eventProperties ] );
}
