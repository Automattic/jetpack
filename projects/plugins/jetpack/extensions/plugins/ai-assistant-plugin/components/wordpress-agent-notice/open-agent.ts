/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import debugFactory from 'debug';
import { useSyncExternalStore } from 'react';

/**
 * Bridge to the WordPress Agent chat, which the Agents Manager owns. It ships in
 * its own bundle and may mount after the editor, so callers ask whether it has
 * arrived before offering to open it.
 */

const debug = debugFactory( 'jetpack-ai-assistant-plugin:wordpress-agent-notice' );

export const AGENTS_MANAGER_READY_EVENT = 'agents-manager-ready';

// The Agents Manager registers this store on the shared wp.data registry.
const AGENTS_MANAGER_STORE = 'automattic/agents-manager';

// The Agents Manager injects a bare `const agentsManagerData` global rather
// than a window property; some hosts assign `window.agentsManagerData` instead.
// A bare identifier read resolves either through the scope chain, and the
// typeof guard keeps it safe when neither exists.
declare const agentsManagerData:
	| { jetpackAiSidebar?: { agentNoticeActionAvailable?: boolean } }
	| undefined;

/**
 * Whether the server considers the notice's action button actionable: the site
 * has a working, connected agent to open, not merely one it is eligible for.
 *
 * @return {boolean} True once there is a working agent to send people to.
 */
export function isAgentActionAvailable(): boolean {
	return (
		typeof agentsManagerData !== 'undefined' &&
		!! agentsManagerData?.jetpackAiSidebar?.agentNoticeActionAvailable
	);
}

type AgentsManagerSelect = {
	getIsOpen?: () => boolean;
	getIsMinimized?: () => boolean;
};

type AgentsManagerActions = {
	isReady?: boolean;
	setChatOpen?: ( isOpen: boolean ) => void;
	resumeChat?: () => void;
};

type WindowWithAgentsManagerActions = Window & {
	__agentsManagerActions?: AgentsManagerActions;
};

function getAgentsManagerActions(): AgentsManagerActions | undefined {
	return ( window as WindowWithAgentsManagerActions ).__agentsManagerActions;
}

function subscribeToAgentsManager( onReady: () => void ): () => void {
	window.addEventListener( AGENTS_MANAGER_READY_EVENT, onReady );
	return () => window.removeEventListener( AGENTS_MANAGER_READY_EVENT, onReady );
}

function getAgentsManagerReady(): boolean {
	return !! getAgentsManagerActions()?.isReady;
}

/**
 * Whether the WordPress Agent chat is there to open. False until the Agents
 * Manager loads, so callers can hold back an action that would do nothing.
 *
 * @return {boolean} True once the chat can be opened.
 */
export function useIsWordPressAgentReady(): boolean {
	return useSyncExternalStore( subscribeToAgentsManager, getAgentsManagerReady, () => false );
}

/**
 * Whether the chat is on screen: open, and not collapsed to its minimised bar.
 *
 * Subscribes to the Agents Manager's store, so the answer follows the reader
 * opening and closing the chat. False until that store is registered.
 *
 * @return {boolean} True while the chat is showing.
 */
export function useIsWordPressAgentChatVisible(): boolean {
	return useSelect( select => {
		const store = select( AGENTS_MANAGER_STORE ) as AgentsManagerSelect | undefined;

		return Boolean( store?.getIsOpen?.() ) && ! store?.getIsMinimized?.();
	}, [] );
}

/**
 * Opens or closes the WordPress Agent chat. Opening also expands it from the
 * minimised bar.
 *
 * @param {boolean} isOpen - Whether the chat should end up open.
 */
export function setWordPressAgentChatOpen( isOpen: boolean ): void {
	const setChatOpen = getAgentsManagerActions()?.setChatOpen;

	if ( ! setChatOpen ) {
		debug( 'Agents Manager exposed no setChatOpen; the chat stays as it is' );
		return;
	}

	setChatOpen( isOpen );
}

/**
 * Sends the chat back to its default view. The chat otherwise reopens wherever
 * it was last left, such as the history list.
 */
export function resumeWordPressAgentChat(): void {
	const resumeChat = getAgentsManagerActions()?.resumeChat;

	if ( ! resumeChat ) {
		debug( 'Agents Manager exposed no resumeChat; the chat keeps its last view' );
		return;
	}

	resumeChat();
}
