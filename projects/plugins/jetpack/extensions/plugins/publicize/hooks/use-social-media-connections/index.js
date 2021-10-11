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

	return {
		connections,
		hasConnections: connections.length > 0,
		hasEnabledConnections: connections && connections.some( connection => connection.enabled ),
		toggleById: toggleConnectionById,
		refresh,
	};
}
