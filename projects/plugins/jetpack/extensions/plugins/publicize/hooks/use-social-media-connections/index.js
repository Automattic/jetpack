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

	const connections = useSelect(
		select => select( editorStore ).getEditedPostAttribute( 'jetpack_publicize_connections' ),
		[]
	);

	return {
		connections,
		toggleById: function ( id ) {
			const filteredConnections = connections.map( connection => ( {
				...connection,
				enabled: connection.id === id ? ! connection.enabled : connection.enabled,
			} ) );

			editPost( {
				jetpack_publicize_connections: filteredConnections,
			} );
		},
	};
}
