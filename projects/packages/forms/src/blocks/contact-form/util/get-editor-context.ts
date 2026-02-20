/**
 * Editor Context Utility
 * Detects which WordPress editor environment the block is running in.
 */

export type EditorContext = 'widget' | 'site' | 'post';

/**
 * Detects the current editor context based on the URL path.
 *
 * @return The editor context: 'widget', 'site', or 'post'
 */
export function getEditorContext(): EditorContext {
	const path = window.location.pathname;
	if ( path.endsWith( '/widgets.php' ) ) {
		return 'widget';
	}
	if ( path.endsWith( '/site-editor.php' ) ) {
		return 'site';
	}
	return 'post';
}
