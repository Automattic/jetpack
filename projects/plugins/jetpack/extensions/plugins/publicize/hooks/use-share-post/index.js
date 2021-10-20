/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState, useEffect, useReducer } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import useSocialMediaMessage from '../use-social-media-message';
import useSocialMediaConnections from '../use-social-media-connections';

function getHumanReadableError( result ) {
	// Errors coming from the API.
	const errorCode = result?.code;

	/*
	 * Errors coming from the external services,
	 * through the REST API in dotcom.
	 * e.g. Tumblr, Facebook, Twitter, etc.
	 */
	const hasSharingErrors = result?.errors?.length;

	if ( ! errorCode && ! hasSharingErrors ) {
		return false;
	}

	let errorMessage = '';

	// @TO-DO: Improve error messages.
	if ( errorCode ) {
		switch ( errorCode ) {
			case 'http_request_failed':
				// Define error message when external service is down.
				errorMessage = __( 'Unable to share the Post', 'jetpack' );
				break;
			case 'rest_invalid_param':
				// Error when something is wrong with the request.
				errorMessage = __( 'Unable to share the Post', 'jetpack' );
				break;

			case 'rest_missing_callback_param':
				// Error when something is wrong with the request.
				errorMessage = __( 'Unable to share the Post', 'jetpack' );
				break;

			default:
				errorMessage = __( 'Unable to share the Post', 'jetpack' );
		}
	}

	// Im multiple requests, the response contains the errors array.
	if ( hasSharingErrors ) {
		errorMessage = __( 'Unable to share the Post', 'jetpack' );
	}

	return {
		message: errorMessage,
		result,
	};
}

/**
 * Simple reducer used to increment a counter.
 *
 * @param {number} state - Previous counter value.
 * @returns {number} New state value.
 */
const counterReducer = state => state + 1;

export default function useSharePost( postId ) {
	// Sharing data.
	const { message } = useSocialMediaMessage();
	const { skippedConnections: skipped_connections } = useSocialMediaConnections();

	// Get post ID to share.
	const currentPostId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );
	postId = postId || currentPostId;

	/*
	 * Create a reducer to trigger the request
	 * by calling triggerRequest().
	 */
	const [ requestNumber, doPublicize ] = useReducer( counterReducer, 0 );

	/*
	 * Store the previous request number.
	 * Used below to detect whether should perform a new request.
	 */
	const prevRequestNumber = usePrevious( requestNumber );

	const [ data, setData ] = useState( {
		isFetching: false,
		isError: false,
		isSuccess: false,
		data: [],
		error: [],
		postId,
	} );

	useEffect( () => {
		// Bail early when no triggered request
		if ( requestNumber === 0 ) {
			return;
		}

		// Bail early when same request is in process.
		if ( requestNumber === prevRequestNumber ) {
			return;
		}

		// Bail early when still fetching.
		if ( data.isFetching ) {
			return;
		}

		// Start the request.
		setData( prev => ( {
			...prev,
			isFetching: true,
		} ) );

		apiFetch( {
			path: `/wpcom/v2/posts/${ postId }/publicize`,
			method: 'POST',
			data: {
				message,
				skipped_connections,
			},
		} )
			.then( ( result = {} ) => {
				const hasError = getHumanReadableError( result );
				if ( hasError ) {
					return setData( prev => ( {
						...prev,
						isSuccess: false,
						isError: true,
						data: [],
						error: hasError,
					} ) );
				}

				// Success.
				setData( prev => ( {
					...prev,
					isSuccess: true,
					isError: false,
					data: result?.results,
					error: [],
				} ) );
			} )
			.catch( error => {
				setData( prev => ( {
					...prev,
					isSuccess: false,
					isError: true,
					data: [],
					error: getHumanReadableError( error ),
				} ) );
			} )
			.finally( () => {
				setData( prev => ( {
					...prev,
					isFetching: false,
				} ) );
			} );

		return function () {
			setData( {
				isFetching: false,
				isError: false,
				isSuccess: false,
				data: [],
				error: [],
				postId,
			} );
		};
	}, [ postId, message, skipped_connections, requestNumber, prevRequestNumber, data.isFetching ] );

	return { ...data, doPublicize };
}
