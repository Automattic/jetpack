import { useDispatch, useSelect } from '@wordpress/data';
import { SOCIAL_STORE_ID } from '../../social-store';

/**
 * Hooks to deal with the social media connections.
 *
 * @returns {Function} Social media connection handler.
 */
export default function useSocialMediaConnections() {
	const { refreshConnectionTestResults: refresh, toggleConnectionById } =
		useDispatch( SOCIAL_STORE_ID );

	const connections = useSelect( select => select( SOCIAL_STORE_ID ).getConnections(), [] );
	const skippedConnections = connections
		.filter( connection => ! connection.enabled )
		.map( connection => connection.id );
	const enabledConnections = connections.filter( connection => connection.enabled );

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
