import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useConnection } from '@automattic/jetpack-connection';
import { useCallback, useEffect } from 'react';

const useAnalyticsTracks = ( {
	pageViewEventName,
	pageViewNamespace = 'jetpack',
	pageViewSuffix = 'page_view',
	pageViewEventProperties = {},
} = {} ) => {
	const { isUserConnected, isRegistered, userConnectionData } = useConnection();
	const { login, ID } = userConnectionData.currentUser?.wpcomUser || {};
	const { tracks } = jetpackAnalytics;
	const { recordEvent } = tracks;

	/**
	 * Record an event if the user has a Jetpack connection
	 *
	 * @type {(function(*, *): void)|*}
	 */
	const recordEventIfConnectedUser = useCallback(
		( eventName, properties ) => {
			// Do nothing if there is not a connected user.
			if ( ! ( isUserConnected && ID && login ) ) {
				return;
			}

			recordEvent( eventName, properties );
		},
		[ recordEvent, isUserConnected, ID, login ]
	);

	const recordEventAsync = useCallback(
		async ( event, properties ) => {
			recordEventIfConnectedUser( event, properties );
		},
		[ recordEventIfConnectedUser ]
	);

	const recordEventHandler = useCallback(
		( eventName, properties, callback = () => {} ) => {
			/*
			 * `properties` is optional,
			 * meaning it can be actually the `callback`.
			 */
			callback = typeof properties === 'function' ? properties : callback;
			properties = typeof properties === 'function' ? {} : properties;

			return () => recordEventAsync( eventName, properties ).then( callback );
		},
		[ recordEventAsync ]
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
	const pageViewEvent = pageViewEventName
		? `${ pageViewNamespace }_${ pageViewEventName }_${ pageViewSuffix }`
		: null;

	useEffect( () => {
		// Also, only run if the site is registered.
		if ( ! isRegistered ) {
			return;
		}

		if ( ! pageViewEvent ) {
			return;
		}

		recordEventIfConnectedUser( pageViewEvent, pageViewEventProperties );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	return {
		recordEvent: recordEventAsync,
		recordEventHandler,
	};
};
export default useAnalyticsTracks;
