import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	getGooglePhotosPickerCachedSessionId,
	setGooglePhotosPickerSession,
} from '../../media-service';
import { store as mediaStore } from '../../store';

const SESSION_PATH = '/wpcom/v2/external-media/session/google_photos';

const isExpired = session =>
	!! session.expireTime && new Date( session.expireTime ).getTime() < Date.now();

// `data` carries Google's status; on Atomic the proxy drops the HTTP status, so don't rely on it.
// A missing Photos Picker scope persists until the user reconnects and grants it.
const needsReconnectPrompt = error =>
	error?.data?.status === 401 ||
	error?.data?.google_status === 'UNAUTHENTICATED' ||
	error?.data?.reason === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT';

const isSessionGone = error => error?.data?.status === 404;

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
	const [ status, setStatus ] = useState( 'idle' ); // 'idle' | 'pending' | 'failed' | 'reconnect'

	// Session requests only update state while their controller is current; replacing it cancels them.
	const controller = useRef( new window.AbortController() );

	const supersedeRequests = useCallback( () => {
		controller.current.abort();
		controller.current = new window.AbortController();
		return controller.current.signal;
	}, [] );

	const fetchPickerSession = useCallback(
		sessionId => {
			const { signal } = controller.current;

			return apiFetch( { path: `${ SESSION_PATH }/${ sessionId }`, signal } )
				.then( session => {
					if ( 'code' in session ) {
						throw session;
					}
					if ( signal.aborted ) {
						return null;
					}
					setGooglePhotosPickerSession( session );
					return session;
				} )
				.catch( error => {
					if ( signal.aborted ) {
						return null;
					}
					if ( needsReconnectPrompt( error ) ) {
						supersedeRequests();
						setStatus( 'reconnect' );
					} else if ( isSessionGone( error ) ) {
						// Forgetting it lets the session effect create a replacement.
						setGooglePhotosPickerSession( null );
					}
					return null;
				} );
		},
		[ supersedeRequests ]
	);

	// Resolves null on failure, after showing an error notice or the reconnect screen.
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
			.catch( error => {
				if ( signal.aborted ) {
					return null;
				}
				if ( needsReconnectPrompt( error ) ) {
					setStatus( 'reconnect' );
					return null;
				}
				noticeOperations.createErrorNotice(
					error?.data?.reason === 'PENDING_USER_ACTION'
						? __(
								'This Google account doesn’t have Google Photos set up yet. Set it up at photos.google.com, then try again.',
								'jetpack-external-media'
							)
						: __(
								'Couldn’t connect to Google Photos. Try again, or disconnect and reconnect your Google account.',
								'jetpack-external-media'
							)
				);
				setStatus( 'failed' );
				return null;
			} );
	}, [ supersedeRequests, noticeOperations ] );

	// Forget the session up front so a failed replacement can't leave the deleted one in use.
	const deletePickerSession = useCallback( sessionId => {
		setGooglePhotosPickerSession( null );
		return apiFetch( { path: `${ SESSION_PATH }/${ sessionId }`, method: 'DELETE' } );
	}, [] );

	// Forget the previous account's session so a reconnect starts fresh.
	useEffect( () => {
		if ( ! isAuthenticated ) {
			supersedeRequests();
			setGooglePhotosPickerSession( null );
			setStatus( 'idle' );
			noticeOperations.removeAllNotices();
		}
	}, [ isAuthenticated, supersedeRequests, noticeOperations ] );

	// Reuse the session saved in the cookie while it's still valid; otherwise create one.
	const ensurePickerSession = useCallback( () => {
		const signal = supersedeRequests();
		setStatus( 'pending' );

		// Read the cookie now: a disconnect since mount clears it.
		const cachedSessionId = getGooglePhotosPickerCachedSessionId();
		const reusable =
			cachedSessionId && cachedSessionId !== pickerSession?.id
				? fetchPickerSession( cachedSessionId )
				: Promise.resolve( null );

		return reusable.then( session => {
			if ( signal.aborted ) {
				return null;
			}
			if ( session && ! isExpired( session ) ) {
				setStatus( 'idle' );
				return session;
			}
			return requestPickerSession();
		} );
	}, [ supersedeRequests, fetchPickerSession, requestPickerSession, pickerSession?.id ] );

	const needsNewSession = ! pickerSession || isExpired( pickerSession );

	useEffect( () => {
		if ( isReady && status === 'idle' && needsNewSession ) {
			ensurePickerSession();
		}
	}, [ isReady, status, needsNewSession, ensurePickerSession ] );

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

	// Resume the open session rather than replace it: the user may still be picking in Google's window.
	const retryAfterAuthFailure = useCallback( () => {
		setStatus( 'idle' );
		if ( ! needsNewSession && ! pickerSession.mediaItemsSet ) {
			fetchPickerSession( pickerSession.id );
		}
	}, [ needsNewSession, pickerSession, fetchPickerSession ] );

	return {
		pickerSession,
		isSessionPending: status === 'pending',
		isSessionFailed: status === 'failed',
		isReconnectRequired: status === 'reconnect',
		requestPickerSession,
		retryAfterAuthFailure,
		deletePickerSession,
	};
}
