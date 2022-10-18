/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useConnection } from '@automattic/jetpack-connection';
import { useCallback, useEffect } from 'react';
/**
 * Internal dependencies
 */
import { useAnalyticsTracksProps } from './types';

const useAnalyticsTracks = ( {
	pageViewEventName,
	pageViewNamespace = 'jetpack_videopress',
	pageViewSuffix = 'page_view',
	pageViewEventProperties = {},
}: useAnalyticsTracksProps ) => {
	const { isUserConnected, isRegistered, userConnectionData } = useConnection();
	const { login, ID } = userConnectionData.currentUser?.wpcomUser || {};

	// Tracks
	const { tracks } = jetpackAnalytics;
	const { recordEvent } = tracks;

	const recordEventAsync = useCallback(
		async ( event, properties ) => {
			recordEvent( event, properties );
		},
		[ recordEvent ]
	);

	const recordEventHandler = useCallback(
		( eventName, properties, callback = () => ( {} ) ) => {
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

		recordEvent( pageViewEvent, pageViewEventProperties );
	}, [] );

	return {
		recordEvent: recordEventAsync,
		recordEventHandler,
	};
};
export default useAnalyticsTracks;
