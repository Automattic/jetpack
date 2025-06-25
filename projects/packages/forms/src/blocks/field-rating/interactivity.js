import { store, getContext, getElement } from '@wordpress/interactivity';

// Shared form store used by all fields.
const jetpackFormStore = store( 'jetpack/form' );

/**
 * Interactivity store for the Jetpack Forms Rating field.
 *
 * Namespace: jetpack/field-rating (keeps consistency with the rest of the fields, e.g. field-file).
 */
store( 'jetpack/field-rating', {
	actions: {
		/**
		 * Updates the rating value in local context and propagates it to the
		 * global `jetpack/form` store so validations & submissions stay in sync.
		 *
		 * @return {void}
		 */
		setRating: () => {
			const { ref } = getElement();
			const selected = parseInt( ref.dataset.value, 10 );
			if ( Number.isNaN( selected ) ) {
				return;
			}

			const context = getContext();

			context.rating = selected;
			context.ratingString = `${ selected }/${ context.maxRating }`;

			// Sync with global form store.
			if ( context.fieldId ) {
				jetpackFormStore.actions.updateFieldValue( context.fieldId, context.ratingString );
			}
		},
	},

	state: {
		/**
		 * True when a star should appear unfilled.
		 * Depends on `context.rating`, so will re-evaluate whenever rating changes.
		 *
		 * @return {boolean} Whether the star is unfilled.
		 */
		get isUnfilled() {
			const { rating = 0, position } = getContext();
			return position > rating;
		},
	},

	callbacks: {
		/**
		 * When the field is initialised on page load, register its current value
		 * with the `jetpack/form` store so that the form has an initial entry.
		 */
		initializeField: () => {
			const context = getContext();
			if ( typeof context.rating === 'undefined' ) {
				context.rating = 0;
			}
			context.ratingString = `${ context.rating }/${ context.maxRating }`;

			if ( context.fieldId ) {
				jetpackFormStore.actions.updateFieldValue( context.fieldId, context.ratingString );
			}
		},
	},
} );
