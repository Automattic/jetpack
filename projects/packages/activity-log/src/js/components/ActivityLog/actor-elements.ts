import { __ } from '@wordpress/i18n';
import type { ActivityLogTypeOption } from './fields';
import type { ActorSummary } from './types';

/** Reserved actor ID that WordPress.com matches against every MCP agent event. */
export const ALL_AI_AGENTS_ACTOR_ID = 'mcp:*';

/**
 * Build the "Performed by" options from the actors endpoint.
 *
 * @param actors              - Distinct actors from /activity-log/actors.
 * @param isAllAiAgentsActive - Whether the current filter includes "All AI agents".
 * @return Options for the `actor` field, "All AI agents" first while that filter is on.
 */
export const getActorElements = (
	actors: ActorSummary[] = [],
	isAllAiAgentsActive = false
): ActivityLogTypeOption[] => {
	const elements = actors
		.filter( actor => actor.id )
		.map( actor => {
			const name = actor.name || actor.id;
			const label = typeof actor.count === 'number' ? `${ name } (${ actor.count })` : name;
			return { value: actor.id, label };
		} )
		.sort( ( a, b ) => a.label.localeCompare( b.label ) );

	return isAllAiAgentsActive
		? [
				{ value: ALL_AI_AGENTS_ACTOR_ID, label: __( 'All AI agents', 'jetpack-activity-log' ) },
				...elements,
			]
		: elements;
};
