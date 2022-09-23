/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { select } from '@wordpress/data';

/**
 * Retrieves host app's namespace e.g. "WordPress" or "Jetpack".
 *
 * @returns {string} hostAppNamespace The host app's namespace.
 */
export default function getHostAppNamespace() {
	return select( blockEditorStore ).getSettings().hostAppNamespace;
}
