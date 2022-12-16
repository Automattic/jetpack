import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useConnection } from '@automattic/jetpack-connection';
import { useState, useCallback, useEffect, useMemo } from 'react';

const { tracks } = jetpackAnalytics;
const { recordEvent } = tracks;

const useAnalyticsTracksForConnectedUser = ( {
	pageViewEventName,
	pageViewNamespace = 'jetpack',
	pageViewSuffix = 'page_view',
	pageViewEventProperties = {},
} = {} ) => {
	const [ pageViewRecorded, setPageViewRecorded ] = useState( false );
	const { isUserConnected, isRegistered, userConnectionData } = useConnection();
	const { login, ID } = useMemo( () => {
		return userConnectionData.currentUser?.wpcomUser || {};
	}, [ userConnectionData.currentUser ] );

	const recordEventAsync = useCallback(
		async ( event, properties = {} ) => {
			// Do nothing if there is not a connected user.
			if ( ! ( isUserConnected && ID && login ) ) {
				return;
			}
			recordEvent( event, properties );
		},
		[ isUserConnected, ID, login ]
	);

	// Initialize Analytics identifying the user.
	useEffect( () => {
		if ( ! ( isUserConnected && ID && login ) ) {
			return;
		}
		jetpackAnalytics.initialize( ID, login );
	}, [ isUserConnected, ID, login ] );

	/*
	 * Track page-view event.
	 * It's considered a page view event
	 * when the component is mounted.
	 */
	useEffect( () => {
		const pageViewEvent = pageViewEventName
			? `${ pageViewNamespace }_${ pageViewEventName }_${ pageViewSuffix }`
			: null;

		// Also, only run if the site is registered.
		if ( ! isRegistered ) {
			return;
		}

		if ( ! pageViewEvent ) {
			return;
		}

		// Ensuring we only record the view event once
		if ( ! pageViewRecorded ) {
			recordEventAsync( pageViewEvent, pageViewEventProperties );
			setPageViewRecorded( true );
		}
	}, [
		pageViewRecorded,
		pageViewNamespace,
		pageViewEventName,
		pageViewSuffix,
		isRegistered,
		pageViewEventProperties,
		recordEventAsync,
	] );

	return {
		recordEvent: recordEventAsync,
	};
};
export default useAnalyticsTracksForConnectedUser;
