/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Hooks to deal with the social media connections.
 *
 * @returns {Function} Social media connection handler.
 */

export default function useSocialMediaConnections() {
	const { editPost } = useDispatch( editorStore );
	const { refreshConnectionTestResults: refresh } = useDispatch( 'jetpack/publicize' );

	const connections = useSelect( select => select( 'jetpack/publicize' ).getConnections(), [] );

	return {
		connections,
		toggleById: function ( id ) {
			const jetpack_publicize_connections = connections.map( connection => ( {
				...connection,
				enabled: connection.id === id ? ! connection.enabled : connection.enabled,
			} ) );

			// Update post metadata.
			editPost( { jetpack_publicize_connections } );

			// Refresh jetpack/publicize store.
			refresh();
		},

		refresh,
	};
}
