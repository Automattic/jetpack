/**
 * Agenttic Chat Provider for Media Editor
 *
 * Main provider component that sets up the agenttic chat system
 * with media editing context, tools, and authentication.
 */

import React, { useEffect } from 'react';
import { useAgentChat } from '@automattic/agenttic-client';
import authProvider from './auth';
import { useMediaEditingContext } from './context';
import { useImageEditingTools } from './tools';
import type { MediaItem } from '../../types';

/**
 * Props for the AgentticChatProvider
 */
interface AgentticChatProviderProps {
	children: React.ReactNode;
	post: MediaItem | null;
}

/**
 * Context for sharing agenttic chat state with child components
 */
interface AgentticChatContextValue {
	messages: any[];
	isProcessing: boolean;
	error: string | null;
	onSubmit: ( message: string ) => Promise< void >;
	onStop?: () => void;
	suggestions: any[];
	clearSuggestions: () => void;
	messageRenderer: React.ComponentType< { children: string } >;
}

/**
 * React context for agenttic chat
 */
const AgentticChatContext = React.createContext< AgentticChatContextValue | null >( null );

/**
 * Hook to use agenttic chat context
 */
export const useAgentticChat = () => {
	const context = React.useContext( AgentticChatContext );
	if ( ! context ) {
		throw new Error( 'useAgentticChat must be used within AgentticChatProvider' );
	}
	return context;
};

const AGENT_ID = 'big-sky';
const AGENT_URL = 'https://public-api.wordpress.com/wpcom/v2/ai/agent';

/**
 * Agenttic Chat Provider Component
 */
export default function AgentticChatProvider( { children, post }: AgentticChatProviderProps ) {
	// TODO: Generate by Jetpack session or by post.id?
	const sessionId = 'media-editor-preview-' + post?.id;

	// Set up context provider for media editing information (include sessionId)
	const contextProvider = useMediaEditingContext( post, sessionId );

	// Set up image editing tools with current post context
	const toolProvider = useImageEditingTools( post );

	// Initialize agenttic chat
	const agentChatState = useAgentChat( {
		agentId: AGENT_ID,
		agentUrl: AGENT_URL,
		sessionId: sessionId!,
		contextProvider,
		toolProvider,
		authProvider,
		enableStreaming: true,
	} );

	// Register initial suggestions for media editing
	useEffect( () => {
		if ( agentChatState.registerSuggestions && post ) {
			agentChatState.registerSuggestions( [
				{
					id: 'crop-image',
					label: 'Crop this image',
					prompt: 'Can you help me crop this image to focus on the main subject?',
				},
				{
					id: 'resize-image',
					label: 'Resize for web',
					prompt: 'Resize this image to be optimized for web use',
				},
				{
					id: 'enhance-image',
					label: 'Enhance quality',
					prompt: 'Can you enhance the brightness and contrast of this image?',
				},
				{
					id: 'image-info',
					label: 'Image details',
					prompt: 'Tell me about this image - its dimensions, file size, and format',
				},
			] );
		}
	}, [ agentChatState.registerSuggestions, post ] );

	// Context value to provide to children
	const contextValue: AgentticChatContextValue = {
		messages: agentChatState.messages || [],
		isProcessing: agentChatState.isProcessing || false,
		error: agentChatState.error || null,
		onSubmit: agentChatState.onSubmit,
		onStop: agentChatState.abortCurrentRequest,
		suggestions: agentChatState.suggestions || [],
		clearSuggestions: agentChatState.clearSuggestions || ( () => {} ),
		messageRenderer:
			agentChatState.messageRenderer || ( ( { children } ) => <div>{ children }</div> ),
	};

	return (
		<AgentticChatContext.Provider value={ contextValue }>{ children }</AgentticChatContext.Provider>
	);
}
