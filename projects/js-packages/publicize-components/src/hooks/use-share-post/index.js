import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import useSocialMediaMessage from '../../hooks/use-social-media-message';

/**
 * Takes an error object and returns a more meaningful error message.
 *
 * @param {object} result - An API error object.
 * @returns {{ message: string, result: object }} The error message and passed in error object.
 */
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
 * A hook to get the necessary data and callbacks to reshare a post.
 *
 * @param {number} postId - The ID of the post to share.
 * @returns { { doPublicize: Function, data: object } } The doPublicize callback to share the post.
 */
export default function useSharePost( postId ) {
	// Sharing data.
	const { message } = useSocialMediaMessage();
	const { skippedConnections: skipped_connections } = useSocialMediaConnections();

	// Get post ID to share.
	const currentPostId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );
	postId = postId || currentPostId;

	const [ data, setData ] = useState( { data: [], error: {} } );

	const doPublicize = useCallback(
		function () {
			const initialState = {
				isFetching: false,
				isError: false,
				isSuccess: false,
				data: [],
				error: {},
				postId,
			};

			// Bail early when still fetching.
			if ( data.isFetching ) {
				return;
			}

			// Start the request.
			setData( {
				...initialState,
				isFetching: true,
			} );

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
							isFetching: false,
							isSuccess: false,
							isError: true,
							data: [],
							error: hasError,
						} ) );
					}

					// Success.
					setData( prev => ( {
						...prev,
						isFetching: false,
						isSuccess: true,
						isError: false,
						data: result?.results,
						error: {},
					} ) );
				} )
				.catch( error => {
					setData( prev => ( {
						...prev,
						isFetching: false,
						isSuccess: false,
						isError: true,
						data: [],
						error: getHumanReadableError( error ),
					} ) );
				} );

			return function () {
				setData( initialState ); // clean the state.
			};
		},
		[ postId, message, skipped_connections, data.isFetching ]
	);

	return { ...data, doPublicize };
}
