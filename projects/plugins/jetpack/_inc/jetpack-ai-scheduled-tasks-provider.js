/**
 * Agents Manager provider for the AI Hub Scheduled tasks empty view.
 *
 * The translated suggestions are supplied by Jetpack through agentsManagerData.
 */

/* global agentsManagerData */

export const providerId = 'jetpack-ai-hub-scheduled-tasks';

export const getEmptyViewSuggestions = () => {
	if ( typeof agentsManagerData === 'undefined' ) {
		return [];
	}

	return agentsManagerData.scheduledTaskEmptyViewSuggestions ?? [];
};
