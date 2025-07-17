import { getContext, store, getElement } from '@wordpress/interactivity';

store( 'jetpack/form', {
	// progress-indicator module only needs callbacks; progress-related state
	// has been moved to the shared form store.
	callbacks: {
		initializeProgress: () => {
			const elementInfo = getElement();
			if ( ! elementInfo?.ref ) {
				return; // Element not yet available
			}

			const context = getContext();

			// Previously ensured a valid transition value, but multiple transitions
			// are not yet implemented. Removing for now to simplify logic.

			const wrapper = elementInfo.ref;

			const updateProgressHighlight = () => {
				const namesList = wrapper.querySelector( '.jetpack-form-progress-indicator-names' );
				if ( ! namesList ) {
					return;
				}
				const { currentStep } = getContext();
				Array.from( namesList.children ).forEach( child => {
					const li = child;
					const stepIdx = Number( li.dataset.stepIndex );
					const isCurrent = stepIdx === currentStep;
					li.classList.toggle( 'is-current-step', isCurrent );
					if ( isCurrent ) {
						li.setAttribute( 'aria-current', 'step' );
					} else {
						li.removeAttribute( 'aria-current' );
					}
				} );
			};

			const buildNamesList = () => {
				const namesList = wrapper.querySelector( '.jetpack-form-progress-indicator-names' );
				if ( ! namesList ) {
					return;
				}

				// Avoid rebuilding if already populated with expected number of steps.
				if ( namesList.childElementCount >= context.maxSteps ) {
					return;
				}

				// Clear any existing items before (re)building.
				while ( namesList.firstChild ) {
					namesList.removeChild( namesList.firstChild );
				}

				const formEl = wrapper.closest( 'form' );
				if ( ! formEl ) {
					return;
				}

				const stepNodes = Array.from( formEl.querySelectorAll( '.jetpack-form-step' ) );
				if ( stepNodes.length === 0 ) {
					return;
				}

				let labels = store( 'jetpack/form' ).state.stepLabels;
				if ( ! Array.isArray( labels ) || labels.length === 0 ) {
					// Fallback: derive labels from DOM if not provided.
					labels = [];
					stepNodes.forEach( ( stepNode, idx ) => {
						const l = stepNode.getAttribute( 'data-step-label' ) || `Step ${ idx + 1 }`;
						labels.push( l );
					} );
				}

				labels.forEach( ( label, idx ) => {
					const li = document.createElement( 'li' );
					li.textContent = label;
					li.dataset.stepIndex = String( idx + 1 );
					li.classList.toggle( 'is-current-step', idx + 1 === context.currentStep );
					if ( idx + 1 === context.currentStep ) {
						li.setAttribute( 'aria-current', 'step' );
					}
					namesList.appendChild( li );
				} );

				// Initial highlight.
				updateProgressHighlight();
			};

			// Build the names list once on initialization.
			buildNamesList();
			// Expose highlight updater so it can be referenced by data-wp-watch.
			context.updateProgressHighlight = updateProgressHighlight;
		},
		updateProgressHighlight: () => {
			// Exposed for data-wp-watch in markup.
			const context = getContext();
			if ( typeof context.updateProgressHighlight === 'function' ) {
				context.updateProgressHighlight();
			}
		},
	},
} );
