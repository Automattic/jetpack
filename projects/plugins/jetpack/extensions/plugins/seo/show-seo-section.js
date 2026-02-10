/**
 * External dependencies
 */
import { dispatch, select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

export const showSeoSection = async () => {
	const { clearSelectedBlock } = dispatch( 'core/block-editor' );
	const { openGeneralSidebar } = dispatch( 'core/edit-post' );

	// Clear block selection so right sidebar shows document settings, not block settings
	clearSelectedBlock();

	// Open the document/post settings sidebar
	await openGeneralSidebar( 'edit-post/document' );

	// Ensure the SEO panel is expanded (panel name = pluginName/panelName)
	const panelName = 'jetpack-seo/jetpack-seo';
	const isOpen = select( editorStore ).isEditorPanelOpened( panelName );
	if ( ! isOpen ) {
		dispatch( editorStore ).toggleEditorPanelOpened( panelName );
	}

	// Scroll into view after DOM updates
	setTimeout( () => {
		document.querySelector( '.jetpack-seo-panel' )?.scrollIntoView( { behavior: 'smooth' } );
	}, 100 );
};
