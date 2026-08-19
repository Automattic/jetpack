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

type AgentsManagerSelect = {
	getIsOpen?: () => boolean;
	getIsMinimized?: () => boolean;
};

type AgentsManagerActions = {
	isReady?: boolean;
	setChatOpen?: ( isOpen: boolean ) => void;
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
 * Opens the WordPress Agent chat, expanding it from the minimised bar if need be.
 */
export function openWordPressAgent(): void {
	const setChatOpen = getAgentsManagerActions()?.setChatOpen;

	if ( ! setChatOpen ) {
		debug( 'Agents Manager exposed no setChatOpen; the chat stays closed' );
		return;
	}

	setChatOpen( true );
}
