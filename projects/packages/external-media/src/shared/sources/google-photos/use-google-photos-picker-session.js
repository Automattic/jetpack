import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import moment from 'moment';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	getGooglePhotosPickerCachedSessionId,
	setGooglePhotosPickerSession,
} from '../../media-service';
import { store as mediaStore } from '../../store';

const SESSION_PATH = '/wpcom/v2/external-media/session/google_photos';

/**
 * Owns the Google Photos Picker session: reuses the cached one, creates, polls, and clears it.
 *
 * @param {object}  options                  - Options.
 * @param {boolean} options.isAuthenticated  - Whether Google Photos is connected.
 * @param {boolean} options.isReady          - Whether picker sessions can be requested.
 * @param {object}  options.noticeOperations - Notice operations of the media modal.
 * @return {object} The session, its request status, and the actions that change it.
 */
export default function useGooglePhotosPickerSession( {
	isAuthenticated,
	isReady,
	noticeOperations,
} ) {
	const pickerSession = useSelect( select => select( mediaStore ).mediaPhotosPickerSession(), [] );
	const [ status, setStatus ] = useState( 'idle' ); // 'idle' | 'pending' | 'failed'
	const [ isCacheChecked, setIsCacheChecked ] = useState( false );

	// Session requests only update state while their controller is current; replacing it cancels them.
	const controller = useRef( null );

	const supersedeRequests = useCallback( () => {
		controller.current?.abort();
		controller.current = new window.AbortController();
		return controller.current.signal;
	}, [] );

	const fetchPickerSession = useCallback( sessionId => {
		controller.current ??= new window.AbortController();
		const { signal } = controller.current;

		return apiFetch( { path: `${ SESSION_PATH }/${ sessionId }`, signal } )
			.then( session => {
				if ( ! signal.aborted && ! ( 'code' in session ) ) {
					setGooglePhotosPickerSession( session );
				}
			} )
			.catch( () => {} );
	}, [] );

	// Resolves null on failure, after showing an error notice.
	const requestPickerSession = useCallback( () => {
		const signal = supersedeRequests();
		setStatus( 'pending' );
		noticeOperations.removeAllNotices();

		return apiFetch( { path: SESSION_PATH, method: 'POST', signal } )
			.then( session => {
				if ( 'code' in session ) {
					throw session;
				}
				if ( signal.aborted ) {
					return null;
				}
				// Drop polls of the previous session that started while this request was pending.
				supersedeRequests();
				setGooglePhotosPickerSession( session );
				setStatus( 'idle' );
				return session;
			} )
			.catch( () => {
				if ( signal.aborted ) {
					return null;
				}
				noticeOperations.createErrorNotice(
					__(
						'Couldn’t connect to Google Photos. Try again, or disconnect and reconnect your Google account.',
						'jetpack-external-media'
					)
				);
				setStatus( 'failed' );
				return null;
			} );
	}, [ supersedeRequests, noticeOperations ] );

	const deletePickerSession = useCallback(
		sessionId => apiFetch( { path: `${ SESSION_PATH }/${ sessionId }`, method: 'DELETE' } ),
		[]
	);

	// Forget the previous account's session so a reconnect starts fresh.
	useEffect( () => {
		if ( ! isAuthenticated ) {
			controller.current?.abort();
			controller.current = null;
			setGooglePhotosPickerSession( null );
			setStatus( 'idle' );
			setIsCacheChecked( false );
		}
	}, [ isAuthenticated ] );

	useEffect( () => {
		if ( ! isReady ) {
			return;
		}

		// Read the cookie now: a disconnect since mount clears it.
		const cachedSessionId = getGooglePhotosPickerCachedSessionId();
		if ( ! cachedSessionId ) {
			setIsCacheChecked( true );
			return;
		}

		let isCurrent = true;
		fetchPickerSession( cachedSessionId ).then( () => isCurrent && setIsCacheChecked( true ) );
		return () => {
			isCurrent = false;
		};
	}, [ isReady, fetchPickerSession ] );

	const needsNewSession =
		! pickerSession ||
		'code' in pickerSession ||
		!! ( pickerSession.expireTime && moment( pickerSession.expireTime ).isBefore( new Date() ) );

	useEffect( () => {
		if ( isReady && isCacheChecked && status === 'idle' && needsNewSession ) {
			requestPickerSession();
		}
	}, [ isReady, isCacheChecked, status, needsNewSession, requestPickerSession ] );

	// Poll until the user finishes picking in Google's window.
	const pollSessionId =
		isReady && status === 'idle' && ! pickerSession?.mediaItemsSet ? pickerSession?.id : null;

	useEffect( () => {
		if ( ! pollSessionId ) {
			return;
		}
		const interval = setInterval( () => fetchPickerSession( pollSessionId ), 3000 );
		return () => clearInterval( interval );
	}, [ pollSessionId, fetchPickerSession ] );

	return {
		pickerSession,
		isSessionPending: status === 'pending',
		isSessionFailed: status === 'failed',
		requestPickerSession,
		deletePickerSession,
	};
}
