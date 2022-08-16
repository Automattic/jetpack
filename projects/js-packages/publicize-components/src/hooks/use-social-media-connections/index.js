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
	const skippedConnections = connections
		.filter( connection => ! connection.enabled )
		.map( connection => connection.id );
	const enabledConnections = connections
		.filter( connection => connection.enabled )
		.map( connection => connection.id );

	return {
		connections,
		hasConnections: connections.length > 0,
		hasEnabledConnections: connections && connections.some( connection => connection.enabled ),
		skippedConnections,
		enabledConnections,
		toggleById: toggleConnectionById,
		refresh,
	};
}
