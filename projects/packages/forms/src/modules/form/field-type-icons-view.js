/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';
/**
 * Internal dependencies
 */
import { getFieldTypeIconHtml, getFieldTypeIconKey } from './field-type-icons.js';

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

			const context = getContext();
			const fieldType = context.submission?.type || 'text';
			const value = context.submission?.value;
			// The rendered marker is the icon key, not the field type: a checkbox
			// resolves to a different icon depending on the submitted value, so
			// comparing types alone would leave a stale icon in place.
			const iconKey = getFieldTypeIconKey( fieldType, value );

			// If the server already rendered this exact icon, preserve it.
			// This handles page reloads where PHP renders the SVG from disk.
			if ( ref.dataset.renderedType === iconKey && ref.innerHTML.trim() !== '' ) {
				return;
			}

			// For AJAX submissions, render the icon via JS.
			ref.innerHTML = getFieldTypeIconHtml( fieldType, value );
			ref.dataset.renderedType = iconKey;
		},
	},
} );
