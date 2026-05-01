/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';
/**
 * Internal dependencies
 */
import { getFieldTypeIconHtml } from './field-type-icons.js';

const NAMESPACE = 'jetpack/form';

store( NAMESPACE, {
	callbacks: {
		/**
		 * Watches for field type changes and renders the appropriate icon.
		 * This callback is triggered when the submission data is updated (AJAX submissions)
		 * or on initial page load (server-rendered submissions).
		 */
		watchFieldTypeIcon() {
			const { ref } = getElement();
			if ( ! ref ) {
				return;
			}

			// If server already rendered an icon (has content), preserve it.
			// This handles page reloads where PHP renders the SVG from disk.
			if ( ref.dataset.renderedType && ref.innerHTML.trim() !== '' ) {
				return;
			}

			// For AJAX submissions, render the icon via JS.
			const context = getContext();
			const fieldType = context.submission?.type || 'text';

			ref.innerHTML = getFieldTypeIconHtml( fieldType );
			ref.dataset.renderedType = fieldType;
		},
	},
} );
