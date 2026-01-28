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
			const context = getContext();

			// For AJAX submissions, get the field type from context.
			const fieldType = context.submission?.type || 'text';

			// If the element already has the correct icon, skip re-rendering.
			// This prevents unnecessary DOM updates during hydration.
			if ( ref?.dataset?.renderedType === fieldType ) {
				return;
			}

			// Render the icon.
			if ( ref ) {
				ref.innerHTML = getFieldTypeIconHtml( fieldType );
				ref.dataset.renderedType = fieldType;
			}
		},
	},
} );
