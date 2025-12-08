/**
 * Jetpack Form Editor - Adds visual wrapper for proper form display.
 *
 * This script adds a DOM wrapper around the block list to provide the
 * contact-form styling without actually inserting a contact-form block.
 * This keeps the block structure clean while providing proper visual context.
 */

import { select, subscribe } from '@wordpress/data';
import './editor.scss';

let hasWrapped = false;

/**
 * Add a DOM wrapper around the block list for form styling.
 */
const addVisualWrapper = () => {
	// Only run once.
	if ( hasWrapped ) {
		return;
	}

	const editor = select( 'core/editor' );

	// Check if editor is available and post type is jetpack-form.
	if ( ! editor ) {
		return;
	}

	const postType = editor.getCurrentPostType();

	// If post type is not loaded yet, wait for next iteration
	if ( ! postType ) {
		return;
	}

	// If this is not a jetpack-form post, stop trying
	if ( postType !== 'jetpack-form' ) {
		hasWrapped = true; // Don't keep trying on non-form posts
		return;
	}

	// Try to find the editor canvas - check both regular and iframe editor
	let editorCanvas = document.querySelector( '.editor-styles-wrapper' );

	// If not found, try looking in iframe (block editor might be in iframe)
	if ( ! editorCanvas ) {
		const iframe = document.querySelector( 'iframe[name="editor-canvas"]' );
		if ( iframe && iframe.contentDocument ) {
			editorCanvas = iframe.contentDocument.querySelector( '.editor-styles-wrapper' );
		}
	}

	if ( ! editorCanvas ) {
		return;
	}

	// Find the block list container
	const blockList = editorCanvas.querySelector( '.block-editor-block-list__layout' );

	if ( ! blockList || blockList.children.length === 0 ) {
		return;
	}

	// Check if we already added a wrapper
	if ( blockList.classList.contains( 'jetpack-form-editor-wrapped' ) ) {
		hasWrapped = true;
		return;
	}

	// Add a wrapper div with the contact-form classes
	const wrapper = document.createElement( 'div' );
	wrapper.className = 'jetpack-form-visual-wrapper wp-block-jetpack-contact-form';

	// Create inner wrapper with the form styling class
	const innerWrapper = document.createElement( 'div' );
	innerWrapper.className = 'jetpack-contact-form';

	// Mark the block list as wrapped
	blockList.classList.add( 'jetpack-form-editor-wrapped' );

	// Insert the wrapper structure
	blockList.parentNode.insertBefore( wrapper, blockList );
	wrapper.appendChild( innerWrapper );
	innerWrapper.appendChild( blockList );

	hasWrapped = true;
};

// Subscribe to editor changes to add wrapper when ready.
const unsubscribe = subscribe( () => {
	addVisualWrapper();

	// Unsubscribe once we've wrapped.
	if ( hasWrapped ) {
		unsubscribe();
	}
} );
