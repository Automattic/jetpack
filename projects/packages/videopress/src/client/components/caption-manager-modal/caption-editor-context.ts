/**
 * External dependencies
 */
import { createContext, useContext } from '@wordpress/element';
/**
 * Types
 */
import type { MutableRefObject } from 'react';

export type CaptionEditorContextValue = {
	/**
	 * Client ID of a freshly inserted cue whose text field should grab focus
	 * once it mounts, so adding a cue lands the caret in the caption text
	 * rather than on the first toolbar button.
	 */
	pendingFocusClientIdRef: MutableRefObject< string | null >;
};

/**
 * Context the caption manager modal provides to the cue blocks rendered in its
 * embedded block editor. Carries the editor-wide bits a block edit component
 * can't receive as props.
 */
export const CaptionEditorContext = createContext< CaptionEditorContextValue >( {
	pendingFocusClientIdRef: { current: null },
} );

/**
 * Read the caption editor context.
 *
 * @return The current context value.
 */
export const useCaptionEditorContext = (): CaptionEditorContextValue =>
	useContext( CaptionEditorContext );
