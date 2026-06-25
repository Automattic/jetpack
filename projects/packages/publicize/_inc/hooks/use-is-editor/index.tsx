import { createContext, useContext } from '@wordpress/element';

const IsEditorContext = createContext( false );

/**
 * Marks its subtree (including portaled modals) as rendered inside the block editor. Wrap the
 * editor's social UI so shared components can branch on context without importing the editor package.
 */
export const IsEditorProvider = IsEditorContext.Provider;

/**
 * Whether the social UI is rendered inside the block editor.
 *
 * @return True in the editor.
 */
export function useIsEditor(): boolean {
	return useContext( IsEditorContext );
}
