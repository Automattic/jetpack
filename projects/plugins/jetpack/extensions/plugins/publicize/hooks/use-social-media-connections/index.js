/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Hooks to deal with the social media connections.
 *
 * @returns {Function} Social media connection handler.
 */

export default function useSocialMediaConnections() {
	const { refreshConnectionTestResults: refresh } = useDispatch( 'jetpack/publicize' );
	const connections = useSelect( select => select( 'jetpack/publicize' ).getConnections(), [] );

	return {
		connections,
		toggleById: function ( id ) {
			const jetpack_publicize_connections = connections.map( connection => ( {
				...connection,
				enabled: connection.id === id ? ! connection.enabled : connection.enabled,
			} ) );

			refresh( jetpack_publicize_connections );
		},

		refresh,
	};
}
