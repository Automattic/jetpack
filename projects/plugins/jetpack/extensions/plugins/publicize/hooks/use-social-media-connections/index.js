/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import useSocialMediaMessage from '../use-social-media-message';

/**
 * Hooks to deal with the social media connections.
 *
 * @returns {Function} Social media connection handler.
 */
export default function useSocialMediaConnections() {
	const { refreshConnectionTestResults: refresh, toggleConnectionById } = useDispatch(
		'jetpack/publicize'
	);

	const connections = useSelect( select => select( 'jetpack/publicize' ).getConnections(), [] );
	const enabledConnections = connections.filter( connection => connection.enabled );

	return {
		connections,
		hasEnabledConnections: enabledConnections.length > 0,
		enabledConnections,
		toggleById: toggleConnectionById,
		refresh,
	};
}

export function useSharePost( callback ) {
	const { message } = useSocialMediaMessage();
	const { connections } = useSocialMediaConnections();
	const currentPostId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );

	const skippedConnectionIds = connections
		.filter( connection => ! connection.enabled )
		.map( connection => connection.id );

	return ( { postId } = {} ) => {
		postId = postId || currentPostId;

		apiFetch( {
			path: `/wpcom/v2/publicize/share/${ postId }`,
			method: 'POST',
			data: {
				message,
				skippedConnectionIds,
			},
		} )
			.then( ( result = {} ) => {
				if ( result.code && 'success' !== result.code ) {
					callback( [ result.code ] );
					throw new Error( result.code );
				}

				if ( result.errors?.length ) {
					const errors = result.errors.map( ( { message: error } ) => error );
					callback( errors );
					throw new Error( errors.join( '\n' ) );
				}

				return callback( null, result.results );
			} )
			.catch( error => {
				callback( [ error ] );
			} );
	};
}
