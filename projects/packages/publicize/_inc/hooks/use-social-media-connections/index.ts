import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from 'react';
import { store as socialStore } from '../../social-store';

/**
 * Hooks to deal with the social media connections.
 *
 * @return Social media connection handler.
 */
export default function useSocialMediaConnections() {
	const { refreshConnectionTestResults, toggleConnectionById } = useDispatch( socialStore );

	const connectionsData = useSelect( select => {
		const store = select( socialStore );
		const connections = store.getConnections();
		const enabledConnections = store.getEnabledConnections();
		const disabledConnections = store.getDisabledConnections();

		const hasConnections = connections.length > 0;
		const hasEnabledConnections = enabledConnections.length > 0;

		return {
			connections,
			hasConnections,
			hasEnabledConnections,
			disabledConnections,
			enabledConnections,
		};
	}, [] );

	const skippedConnections = useMemo(
		() => connectionsData.disabledConnections.map( connection => connection.connection_id ),
		[ connectionsData.disabledConnections ]
	);

	return useMemo(
		() => ( {
			...connectionsData,
			skippedConnections,
			toggleById: toggleConnectionById,
			refresh: refreshConnectionTestResults,
		} ),
		[ connectionsData, refreshConnectionTestResults, skippedConnections, toggleConnectionById ]
	);
}
