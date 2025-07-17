import { getContext, store, getElement } from '@wordpress/interactivity';

store( 'jetpack/form', {
	state: {
		get getStepProgress() {
			const context = getContext();
			return ( Math.max( 1, context.currentStep ) / context.maxSteps ) * 100 + '%';
		},
		// Provide numeric progress value (0-100) for aria-valuenow bindings.
		get getStepProgressValue() {
			const context = getContext();
			return Math.round( ( Math.max( 1, context.currentStep ) / context.maxSteps ) * 100 );
		},
		// Expose the current step so we can watch it from markup (data-wp-watch--highlight).
		// Whenever `currentStep` changes, this derived getter will emit a new value and
		// trigger the watcher.
		get highlight() {
			const context = getContext();
			return context.currentStep;
		},
	},
	callbacks: {
		initializeProgress: () => {
			const context = getContext();

			// Ensure a valid transition value.
			if (
				! context.transition ||
				! [ 'none', 'fade', 'slide', 'fade-slide' ].includes( context.transition )
			) {
				context.transition = 'fade-slide';
			}

			const elementInfo = getElement();
			if ( ! elementInfo?.ref ) {
				return; // Element not yet available
			}
			const wrapper = elementInfo.ref;

			const updateHighlight = () => {
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

				stepNodes.forEach( ( stepNode, idx ) => {
					const label = stepNode.getAttribute( 'data-step-label' ) || `Step ${ idx + 1 }`;
					const li = document.createElement( 'li' );
					li.textContent = label;
					// Store step index for easy lookup when highlighting.
					li.dataset.stepIndex = String( idx + 1 );
					li.classList.toggle( 'is-current-step', idx + 1 === context.currentStep );
					if ( idx + 1 === context.currentStep ) {
						li.setAttribute( 'aria-current', 'step' );
					}
					namesList.appendChild( li );
				} );

				// Initial highlight.
				updateHighlight();
			};

			// Build the names list once on initialization.
			buildNamesList();
			// Expose highlight updater so it can be referenced by data-wp-watch.
			context.updateProgressNamesHighlight = updateHighlight;
		},
		updateHighlight: () => {
			// Exposed for data-wp-watch in markup.
			const context = getContext();
			if ( typeof context.updateProgressNamesHighlight === 'function' ) {
				context.updateProgressNamesHighlight();
			}
		},
	},
} );
