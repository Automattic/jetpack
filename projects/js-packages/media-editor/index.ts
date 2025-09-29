/**
 * External dependencies
 */
export { default as MediaEditorLayout } from './src/components/layout';
export { default as MediaEditorProvider } from './src/components/provider';
export { default as MediaEditor } from './src/components/editor';
export { AgentticChatProvider, FloatingChat } from './src/components/agenttic-chat';

/**
 * Hooks
 */
export { useSaveImage } from './src/hooks/use-save-image';
export { useResetEditedEntity } from './src/hooks/reset-edited-entity';
export { useMediaEditorState } from './src/components/provider/with-media-editor-state-provider';

/**
 * Types
 */
export type { MediaItem, MediaItemUpdatable, MediaType } from './src/types';

/**
 * Utils
 */
export { getMediaTypeFromMimeType } from './src/utils';

/**
 * Styles - Note: SCSS files are imported directly by components
 * The plugin's webpack config will handle bundling them
 */
