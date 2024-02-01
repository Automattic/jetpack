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
	pageViewEventProperties = {},
}: useAnalyticsTracksProps ) => {
	const { isUserConnected, isRegistered, userConnectionData } = useConnection();
	const { blogId } = userConnectionData?.currentUser || {};
	const { login, ID } = userConnectionData?.currentUser?.wpcomUser || {};

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

			// Populate event props with blog ID when it's available.
			if ( blogId ) {
				properties.blog_id = blogId;
			}

			return () => recordEventAsync( eventName, properties ).then( callback );
		},
		[ recordEventAsync, blogId ]
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
		// Also, only run if the site is registered.
		if ( ! isRegistered ) {
			return;
		}

		if ( ! pageViewEventName ) {
			return;
		}

		if ( blogId ) {
			pageViewEventProperties.blog_id = blogId;
		}

		recordEvent( pageViewEventName, pageViewEventProperties );
	}, [ blogId ] );

	return {
		recordEvent: recordEventAsync,
		recordEventHandler,
	};
};
export default useAnalyticsTracks;
