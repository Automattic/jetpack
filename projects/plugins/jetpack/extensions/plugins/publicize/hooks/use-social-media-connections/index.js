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
	const { refreshConnectionTestResults: refresh, toggleConnectionById } = useDispatch(
		'jetpack/publicize'
	);

	const connections = useSelect( select => select( 'jetpack/publicize' ).getConnections(), [] );
<<<<<<< HEAD
	const skippedConnections = connections
		.filter( connection => ! connection.enabled )
		.map( connection => connection.id );
=======
>>>>>>> 8ebc95ca01 ([not verified] Fix rebase, back out connections updated state, get new object ref for connection)

	return {
		connections,
		hasConnections: connections.length > 0,
		hasEnabledConnections: connections && connections.some( connection => connection.enabled ),
		skippedConnections,
		toggleById: toggleConnectionById,
		refresh,
	};
}
