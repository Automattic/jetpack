/**
 * External dependencies
 */
import {
	createJetpackAuthProvider,
	type JetpackApiError,
	type UIMessage,
	useAgentChat,
} from '@automattic/agenttic-client';
import { AgentUI } from '@automattic/agenttic-ui';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editPostStore } from '@wordpress/edit-post';
import { PluginSidebar, store as editorStore } from '@wordpress/editor';
import { useEffect, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import useApplyBlockEdits from '../hooks/use-apply-block-edits';
import { createToolProvider, createContextProvider } from '../utils/agent-helpers';
import './style.scss';

const SIDEBAR_IDENTIFIER = 'agenttic/sidebar';
const SIDEBAR_DOM_ID = SIDEBAR_IDENTIFIER.replace( '/', ':' );
const SIDEBAR_WIDTH = '600px';
const IMAGE_BLOCK_NAME = 'core/image';
const DEFAULT_AGENT_ID = 'big-sky';
const DEFAULT_AGENT_URL = 'https://public-api.wordpress.com/wpcom/v2/ai/agent';

interface AgentticConfig {
	agent_id?: string;
	agent_key?: string;
	agent_url?: string;
}

interface AgentticChatProps {
	agentId: string;
	agentUrl: string;
	postId?: number;
}

/**
 * Generate a UUID v4
 */
const generateUUID = (): string => {
	// Using crypto.randomUUID if available (modern browsers)
	if ( typeof crypto !== 'undefined' && crypto.randomUUID ) {
		return crypto.randomUUID();
	}

	// Fallback to manual UUID v4 generation
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function ( c ) {
		const r = ( Math.random() * 16 ) | 0;
		const v = c === 'x' ? r : ( r & 0x3 ) | 0x8;
		return v.toString( 16 );
	} );
};

const buildWelcomeMessage = (): UIMessage => ( {
	id: generateUUID(),
	role: 'agent',
	content: [
		{
			type: 'text',
			text: __(
				'Hi! I can help you edit blocks in your post, create images, or answer questions. How can I assist you today?',
				'jetpack'
			),
		},
	],
	timestamp: Date.now(),
	archived: false,
	showIcon: true,
	icon: 'assistant',
} );

const AgentticChat = ( { agentId, agentUrl, postId }: AgentticChatProps ) => {
	// Get block editing functionality
	const { applyBlockEdits } = useApplyBlockEdits();

	const authProvider = useMemo(
		() =>
			createJetpackAuthProvider( ( error: JetpackApiError ) => {
				if ( error?.code === 'rest_forbidden' ) {
					return __(
						'You need the correct permissions to generate images for this site.',
						'jetpack'
					);
				}

				return __(
					'We could not verify your Jetpack connection. Please refresh and try again.',
					'jetpack'
				);
			} ),
		[]
	);

	const fallbackSessionRef = useRef( generateUUID() );
	const sessionId = useMemo( () => {
		if ( postId ) {
			return `post-${ postId }-block-editor`;
		}
		return fallbackSessionRef.current;
	}, [ postId ] );

	// Create tool and context providers using the helper functions
	const toolProvider = useMemo( () => createToolProvider( applyBlockEdits ), [ applyBlockEdits ] );
	const contextProvider = useMemo( () => createContextProvider(), [] );

	const {
		messages,
		isProcessing,
		error,
		onSubmit,
		suggestions,
		clearSuggestions,
		messageRenderer,
		abortCurrentRequest,
		addMessage,
	} = useAgentChat( {
		agentId,
		agentUrl,
		sessionId,
		authProvider,
		enableStreaming: true,
		toolProvider,
		contextProvider,
	} );

	const hasSeededGreeting = useRef( false );

	useEffect( () => {
		if ( hasSeededGreeting.current ) {
			return;
		}

		if ( messages.length > 0 ) {
			hasSeededGreeting.current = true;
			return;
		}

		addMessage( buildWelcomeMessage() );
		hasSeededGreeting.current = true;
	}, [ addMessage, messages ] );

	return (
		<AgentUI
			messages={ messages }
			isProcessing={ isProcessing }
			error={ error }
			onSubmit={ onSubmit }
			suggestions={ suggestions }
			clearSuggestions={ clearSuggestions }
			messageRenderer={ messageRenderer }
			onStop={ abortCurrentRequest }
			variant="embedded"
			placeholder={ __( 'Type a message…', 'jetpack' ) }
		/>
	);
};

const AgentticSidebar = () => {
	const isPostEditor = ( window as any )?.Jetpack_Editor_Initial_State?.screenBase === 'post';

	const { isImageSelected, postId, isSidebarActive } = useSelect( select => {
		const blockEditor = select( blockEditorStore ) as any;
		const selectedBlock = blockEditor?.getSelectedBlock?.();
		const editPost = select( 'core/edit-post' ) as {
			getActiveGeneralSidebarName?: () => string | undefined;
		};

		return {
			isImageSelected: selectedBlock?.name === IMAGE_BLOCK_NAME,
			postId: select( editorStore )?.getCurrentPostId?.(),
			isSidebarActive: editPost?.getActiveGeneralSidebarName?.() === SIDEBAR_IDENTIFIER,
		};
	}, [] );

	const { openGeneralSidebar } = useDispatch( editPostStore );

	useEffect( () => {
		if ( ! isPostEditor || ! isImageSelected || typeof openGeneralSidebar !== 'function' ) {
			return;
		}

		openGeneralSidebar( SIDEBAR_IDENTIFIER );
	}, [ isImageSelected, isPostEditor, openGeneralSidebar ] );

	useEffect( () => {
		if ( ! isSidebarActive || typeof document === 'undefined' ) {
			return;
		}

		const panel = document.getElementById( SIDEBAR_DOM_ID );

		if ( ! panel ) {
			return;
		}

		const pluginFill = panel.closest( '.interface-complementary-area__fill' ) as HTMLElement | null;

		if ( ! pluginFill ) {
			return;
		}

		const storedFillStyles = {
			width: pluginFill.style.width,
			maxWidth: pluginFill.style.maxWidth,
			flex: pluginFill.style.flex,
			overflow: pluginFill.style.overflow,
		};

		pluginFill.style.width = SIDEBAR_WIDTH;
		pluginFill.style.maxWidth = SIDEBAR_WIDTH;
		pluginFill.style.flex = `0 0 ${ SIDEBAR_WIDTH }`;
		pluginFill.style.overflow = 'hidden';

		return () => {
			pluginFill.style.width = storedFillStyles.width;
			pluginFill.style.maxWidth = storedFillStyles.maxWidth;
			pluginFill.style.flex = storedFillStyles.flex;
			pluginFill.style.overflow = storedFillStyles.overflow;
		};
	}, [ isSidebarActive ] );

	// Always render the sidebar in post editor (remove the block selection requirement)
	const shouldRender = isPostEditor;

	if ( ! shouldRender ) {
		return null;
	}

	const config = ( ( window as any )?.Jetpack_Editor_Initial_State?.agenttic ??
		{} ) as AgentticConfig;
	const agentId = config.agent_id ?? config.agent_key ?? DEFAULT_AGENT_ID;
	const agentUrl = config.agent_url ?? DEFAULT_AGENT_URL;
	const hasAgentConfig = Boolean( agentUrl );

	return (
		<PluginSidebar
			name={ SIDEBAR_IDENTIFIER }
			title={ __( 'Block Editor Assistant', 'jetpack' ) }
			icon={
				<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" role="img">
					<title>{ __( 'Jetpack AI Spark', 'jetpack' ) }</title>
					<path
						fill="#3858E9"
						d="m19.223 11.55-3.095-1.068a4.21 4.21 0 0 1-2.61-2.61L12.45 4.777c-.145-.426-.755-.426-.9 0l-1.068 3.095a4.21 4.21 0 0 1-2.61 2.61L4.777 11.55c-.426.145-.426.755 0 .9l3.095 1.068a4.21 4.21 0 0 1 2.61 2.61l1.068 3.095c.145.426.755.426.9 0l1.068-3.095a4.21 4.21 0 0 1 2.61-2.61l3.095-1.068c.426-.145.426-.755 0-.9Zm-3.613.68-1.547.533a2.105 2.105 0 0 0-1.306 1.305l-.533 1.548a.24.24 0 0 1-.453 0l-.534-1.548a2.105 2.105 0 0 0-1.305-1.305l-1.548-.534a.24.24 0 0 1 0-.453l1.548-.534a2.105 2.105 0 0 0 1.305-1.305l.534-1.547a.24.24 0 0 1 .453 0l.534 1.547c.21.615.695 1.095 1.305 1.305l1.547.534a.24.24 0 0 1 0 .453Z"
					/>
				</svg>
			}
			className="jetpack-agenttic-sidebar"
		>
			<div className="jetpack-agenttic-sidebar__content">
				{ ! hasAgentConfig && (
					<Notice status="warning" isDismissible={ false }>
						{ __(
							'Block editing assistant is not available on this site right now. Check your Jetpack connection and try again.',
							'jetpack'
						) }
					</Notice>
				) }

				{ hasAgentConfig && (
					<div className="jetpack-agenttic-sidebar__chat">
						<AgentticChat
							agentId={ agentId }
							agentUrl={ agentUrl }
							postId={ typeof postId === 'number' ? postId : undefined }
						/>
					</div>
				) }
			</div>
		</PluginSidebar>
	);
};

export default AgentticSidebar;
