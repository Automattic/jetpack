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
export default function useSocialMediaConnection() {
	const { editPost } = useDispatch( editorStore );

	const connections = useSelect(
		select => select( editorStore ).getEditedPostAttribute( 'jetpack_publicize_connections' ),
		[]
	);

	return {
		toggleEnableState: function ( id ) {
			const filteredConnections = connections.map( connection => ( {
				...connection,
				enabled: connection.id === id ? ! connection.enabled : connection.enabled,
			} ) );

			editPost( {
				jetpack_publicize_connections: filteredConnections,
			} );
		},
		updateMessage: function ( message, hasEdited = true ) {
			editPost( {
				meta: {
					jetpack_publicize_message: message,
					jetpack_publicize_hasEditedShareMessage: hasEdited,
				},
			} );
		},
	};
}
