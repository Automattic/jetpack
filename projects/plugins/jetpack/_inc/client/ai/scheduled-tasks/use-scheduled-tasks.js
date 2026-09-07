import { requestJwt } from '@automattic/jetpack-ai-client';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

const PUBLIC_API_ROOT = 'https://public-api.wordpress.com/wpcom/v2/sites';

/**
 * Fetch and mutate the current user's scheduled tasks through the Public API.
 *
 * @param {object} props          - Hook options.
 * @param {number} props.blogId   - WordPress.com site ID.
 * @param {string} props.apiNonce - Local REST nonce used to request the existing AI JWT.
 * @return {object} Task state and mutation helpers.
 */
export function useScheduledTasks( { blogId, apiNonce } ) {
	const [ tasks, setTasks ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState( null );
	const [ inFlightIds, setInFlightIds ] = useState( [] );
	const refreshTimer = useRef();

	const request = useCallback(
		async ( path = '', options = {} ) => {
			const { token } = await requestJwt( { apiNonce } );
			const response = await fetch(
				`${ PUBLIC_API_ROOT }/${ encodeURIComponent( blogId ) }/ai/scheduled-tasks${ path }`,
				{
					...options,
					headers: {
						Authorization: `Bearer ${ token }`,
						'Content-Type': 'application/json',
						...options.headers,
					},
				}
			);
			const body = await response.json().catch( () => ( {} ) );
			if ( ! response.ok ) {
				throw new Error( body.message || 'The scheduled task request failed.' );
			}
			return body;
		},
		[ apiNonce, blogId ]
	);

	const refresh = useCallback(
		async ( { quiet = false } = {} ) => {
			if ( ! blogId ) {
				setTasks( [] );
				setIsLoading( false );
				return;
			}
			if ( ! quiet ) {
				setIsLoading( true );
			}
			try {
				const result = await request( '?per_page=100' );
				setTasks( Array.isArray( result.tasks ) ? result.tasks : [] );
				setError( null );
			} catch ( requestError ) {
				setError( requestError.message );
			} finally {
				setIsLoading( false );
			}
		},
		[ blogId, request ]
	);

	useEffect( () => {
		refresh();
	}, [ refresh ] );

	useEffect( () => {
		const debounceRefresh = () => {
			window.clearTimeout( refreshTimer.current );
			refreshTimer.current = window.setTimeout( () => refresh( { quiet: true } ), 500 );
		};
		const onVisibility = () => {
			if ( document.visibilityState === 'visible' ) {
				debounceRefresh();
			}
		};
		window.addEventListener( 'focus', debounceRefresh );
		window.addEventListener( 'agents-manager-conversation-changed', debounceRefresh );
		document.addEventListener( 'visibilitychange', onVisibility );
		return () => {
			window.clearTimeout( refreshTimer.current );
			window.removeEventListener( 'focus', debounceRefresh );
			window.removeEventListener( 'agents-manager-conversation-changed', debounceRefresh );
			document.removeEventListener( 'visibilitychange', onVisibility );
		};
	}, [ refresh ] );

	const mutate = useCallback(
		async ( taskId, path, options ) => {
			setInFlightIds( current => [ ...current, taskId ] );
			try {
				const result = await request( `/${ taskId }${ path }`, options );
				await refresh( { quiet: true } );
				return result;
			} finally {
				setInFlightIds( current => current.filter( id => id !== taskId ) );
			}
		},
		[ refresh, request ]
	);

	return {
		tasks,
		isLoading,
		error,
		inFlightIds,
		refresh,
		runNow: taskId => mutate( taskId, '/run', { method: 'POST' } ),
		setStatus: ( taskId, status ) =>
			mutate( taskId, '', { method: 'PATCH', body: JSON.stringify( { status } ) } ),
		deleteTask: taskId => mutate( taskId, '', { method: 'DELETE' } ),
	};
}
