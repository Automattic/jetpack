import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useConnection } from '@automattic/jetpack-connection';
import { useEffect, useState, useCallback } from '@wordpress/element';

const { tracks } = jetpackAnalytics;
const { recordEvent } = tracks;

const useAnalytics = ( {
	pageViewEventName = null,
	pageViewNamespace = 'jetpack',
	pageViewSuffix = 'page_view',
	pageViewEventProperties = {},
} = {} ) => {
	const [ pageViewRecorded, setPageViewRecorded ] = useState( false );
	const { isUserConnected, isRegistered, userConnectionData = {} } = useConnection();
	const { wpcomUser: { login, ID } = {}, blogId } = userConnectionData.currentUser || {};

	/**
	 * Record an event async
	 * Check to ensure there is a connected user first
	 */
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

	/**
	 * Initialize tracks with user and blog data.
	 * This will only work if the user is connected.
	 */
	useEffect( () => {
		if ( ! isUserConnected || ! ID || ! login || ! blogId ) {
			return;
		}

		jetpackAnalytics.initialize( ID, login, {
			blog_id: blogId,
		} );
	}, [ blogId, ID, login, isUserConnected ] );

	/**
	 * Track a page-view type event.
	 * It's considered a page view event when the component is mounted.
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
		tracks: tracks,
	};
};

export default useAnalytics;
