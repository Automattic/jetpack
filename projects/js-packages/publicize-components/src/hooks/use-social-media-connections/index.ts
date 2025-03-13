import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as socialStore } from '../../social-store';

/**
 * Hooks to deal with the social media connections.
 *
 * @return {object} Social media connection handler.
 */
export default function useSocialMediaConnections() {
	const { refreshConnectionTestResults, toggleConnectionById } = useDispatch( socialStore );

	const connections = useSelect( select => select( socialStore ).getConnections(), [] );

	const enabledConnections = useSelect(
		select => select( socialStore ).getEnabledConnections(),
		[]
	);

	const disabledConnections = useSelect(
		select => select( socialStore ).getDisabledConnections(),
		[]
	);

	const skippedConnections = useMemo(
		() => disabledConnections.map( connection => connection.connection_id ),
		[ disabledConnections ]
	);

	const hasConnections = connections.length > 0;
	const hasEnabledConnections = enabledConnections.length > 0;

	return {
		connections,
		hasConnections,
		hasEnabledConnections,
		skippedConnections,
		enabledConnections,
		toggleById: toggleConnectionById,
		refresh: refreshConnectionTestResults,
	};
}
