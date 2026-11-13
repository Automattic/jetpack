/**
 * Bridge to the WordPress Agent chat, which the Agents Manager owns. It ships
 * in its own bundle and loads only on some hosts, so the Discover tab offers it
 * only once it has arrived and can take a prompt.
 */

import { useSyncExternalStore } from '@wordpress/element';

const READY_EVENT = 'agents-manager-ready';

const getActions = () => window.__agentsManagerActions;

// Injected as a bare `const`, not a window property, so read it behind a
// typeof guard. Only an explicit false from the server hides the agent.
const isAgentAllowed = () =>
	typeof agentsManagerData === 'undefined' ||
	// eslint-disable-next-line no-undef
	agentsManagerData?.jetpackAiSidebar?.agentNoticeActionAvailable !== false;

/**
 * Whether the chat is loaded and can be handed a prompt. `setChatInput` is
 * optional in the Agents Manager API; without it the chat would open empty.
 *
 * @return {boolean} True when Ask WordPress Agent can do its job.
 */
export function isWordPressAgentAvailable() {
	const actions = getActions();
	return !! actions?.isReady && typeof actions.setChatInput === 'function' && isAgentAllowed();
}

const subscribe = onChange => {
	window.addEventListener( READY_EVENT, onChange );
	return () => window.removeEventListener( READY_EVENT, onChange );
};

/**
 * Whether Ask WordPress Agent can be offered, following the Agents Manager as
 * it loads.
 *
 * @return {boolean} True once the agent is there to ask.
 */
export function useIsWordPressAgentAvailable() {
	return useSyncExternalStore( subscribe, isWordPressAgentAvailable, () => false );
}

/**
 * Open a new WordPress Agent chat with the prompt in the composer. The prompt
 * is left for the user to send, matching the other agents.
 *
 * @param {string} prompt - The prompt to put in the composer.
 * @return {boolean} Whether the chat was opened.
 */
export function askWordPressAgent( prompt ) {
	if ( ! isWordPressAgentAvailable() ) {
		return false;
	}
	const actions = getActions();
	// The catch-all route turns `/` into a fresh chat, so the prompt never
	// lands in the middle of an earlier conversation.
	actions.chatNavigate?.( '/' );
	actions.setChatOpen?.( true );
	actions.setChatInput( prompt );
	return true;
}
