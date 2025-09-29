/**
 * Media Editor Context Provider for Agenttic Chat
 *
 * Provides current media item data and editing state as context
 * for the agenttic chat system. This allows the AI agent to understand
 * what media is being edited and its current state.
 */

import { useClientContext } from '@automattic/agenttic-client';
import { useMediaEditorState } from '../provider/with-media-editor-state-provider';
import type { MediaItem } from '../../types';

/**
 * Interface for media editing context provided to the agent
 */
interface MediaEditingContext {
	// Current media item
	media: {
		id: number;
		title: string;
		alt_text: string;
		caption: string;
		description: string;
		mime_type: string;
		file_size: number;
		dimensions: {
			width: number;
			height: number;
		};
		url: string;
		metadata: Record< string, any >;
	};

	// Current editing state
	editing: {
		hasChanges: boolean;
		isImageEditorOpen: boolean;
		currentTool?: string;
		cropSettings?: {
			x: number;
			y: number;
			width: number;
			height: number;
			aspectRatio?: string;
		};
		transformations?: {
			rotation?: number;
			scale?: number;
			filters?: Record< string, number >;
		};
	};

	// User capabilities
	user: {
		canEditMedia: boolean;
		canUploadFiles: boolean;
		canDeleteMedia: boolean;
	};

	// WordPress environment info
	environment: {
		wpVersion: string;
		isMultisite: boolean;
		currentScreen: string;
		timestamp: number;
	};
}

/**
 * Create context provider for media editing
 */
export const useMediaEditingContext = ( post: MediaItem | null, sessionId?: string ) => {
	const { isImageEditorOpen } = useMediaEditorState();

	return useClientContext( () => {
		if ( ! post ) {
			// Even without a post, provide stable client keys
			const baseContext: Record< string, any > = {
				sessionId: sessionId || 'media-editor-preview',
				currentScreen: {
					screen: 'media-editor',
					postType: 'attachment',
					url: typeof location !== 'undefined' ? location.href : '',
				},
				availableBlocks: [],
				currentPageContent: [],
				selectedBlockClientId: '',
				uploadedFiles: [],
				media_editor: {
					is_active: true,
					current_item: null,
				},
			};

			// Debug log to verify context payload (dev only)
			try {
				// eslint-disable-next-line no-console
				console.log( '[Agenttic][Context] clientContext (no post):', baseContext );
			} catch {}

			return baseContext;
		}

		const context: MediaEditingContext = {
			media: {
				id: post.id,
				title: typeof post.title === 'string' ? post.title : ( post.title as any )?.rendered || '',
				alt_text: post.alt_text || '',
				caption:
					typeof post.caption === 'string' ? post.caption : ( post.caption as any )?.rendered || '',
				description:
					typeof post.description === 'string'
						? post.description
						: ( post.description as any )?.rendered || '',
				mime_type: post.mime_type || '',
				file_size: post.media_details?.filesize || 0,
				dimensions: {
					width: post.media_details?.width || 0,
					height: post.media_details?.height || 0,
				},
				url: post.source_url || '',
				metadata: post.meta || {},
			},

			editing: {
				hasChanges: false, // TODO: Connect to actual editing state
				isImageEditorOpen,
				// TODO: Add current tool state when available
				// TODO: Add crop settings when available
				// TODO: Add transformation state when available
			},

			user: {
				// TODO: Get actual user capabilities from WordPress
				canEditMedia: true,
				canUploadFiles: true,
				canDeleteMedia: true,
			},

			environment: {
				// TODO: Get actual WordPress version
				wpVersion: '6.4',
				isMultisite: false,
				currentScreen: 'media-editor',
				timestamp: Date.now(),
			},
		};

		// Build server-expected client context keys
		const clientContext: Record< string, any > = {
			sessionId: sessionId || 'media-editor-preview',
			currentScreen: {
				screen: 'media-editor',
				postType: 'attachment',
				url: typeof location !== 'undefined' ? location.href : '',
			},
			availableBlocks: [],
			currentPageContent: [],
			selectedBlockClientId: '',
			uploadedFiles: [],
			media_editor: {
				is_active: true,
				current_item: {
					id: context.media.id,
					url: context.media.url,
					alt_text: context.media.alt_text,
					caption: context.media.caption,
					description: context.media.description,
					mime_type: context.media.mime_type,
					file_size: context.media.file_size,
					dimensions: context.media.dimensions,
					metadata: context.media.metadata,
				},
			},
			// Preserve richer local context as extra keys (not used by server directly)
			media: context.media,
			editing: context.editing,
			user: context.user,
			environment: context.environment,
		};

		// Debug log to verify context payload (dev only)
		try {
			// eslint-disable-next-line no-console
			console.log( '[Agenttic][Context] clientContext:', clientContext );
		} catch {}

		return clientContext;
	} );
};

/**
 * Get current image context for tools
 */
export const getImageContext = ( post: MediaItem | null ) => {
	if ( ! post ) {
		return null;
	}

	return {
		imageUrl: post.source_url || '',
		attachmentId: post.id,
		title:
			typeof post.title === 'string' ? post.title : ( post.title as any )?.rendered || 'Untitled',
		altText: post.alt_text || '',
		mimeType: post.mime_type || '',
		dimensions: post.media_details
			? {
					width: post.media_details.width,
					height: post.media_details.height,
			  }
			: null,
	};
};

/**
 * Default export for the context provider hook
 */
export default useMediaEditingContext;
