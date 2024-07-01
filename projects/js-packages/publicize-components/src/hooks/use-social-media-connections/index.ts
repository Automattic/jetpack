import { useDispatch, useSelect } from '@wordpress/data';
import { store as socialStore } from '../../social-store';

/**
 * Hooks to deal with the social media connections.
 *
 * @returns {object} Social media connection handler.
 */
export default function useSocialMediaConnections() {
	const { refreshConnectionTestResults, toggleConnectionById } = useDispatch( socialStore );

	const connectionsData = useSelect( select => {
		const store = select( socialStore );
		const connections = store.getConnections();
		const enabledConnections = store.getEnabledConnections();
		const skippedConnections = store
			.getDisabledConnections()
			.map( connection => connection.connection_id );

		const hasConnections = connections.length > 0;
		const hasEnabledConnections = enabledConnections.length > 0;

		return {
			connections,
			hasConnections,
			hasEnabledConnections,
			skippedConnections,
			enabledConnections,
		};
	}, [] );

	return {
		...connectionsData,
		toggleById: toggleConnectionById,
		refresh: refreshConnectionTestResults,
	};
}
