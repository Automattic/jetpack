/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { select, useSelect } from '@wordpress/data';

export default function getHostAppNamespace() {
	return select( blockEditorStore ).getSettings().hostAppNamespace;
}
