import './util/form-styles';
import { validateField } from './util/fullscreen-validator';

const { generateStyleVariables } = window.jetpackForms;
const FRONTEND_SELECTOR = '.wp-block-jetpack-contact-form-container';

//Fallback in case of the page load event takes too long to fire up
const fallbackTimer = setTimeout( () => {
	handleFormStyles();
	initFullscreenMode();
}, 3000 );

window.addEventListener( 'load', () => {
	clearTimeout( fallbackTimer );
	handleFormStyles();
	initFullscreenMode();
} );

function handleFormStyles() {
	const formNodes = document.querySelectorAll( FRONTEND_SELECTOR );

	for ( const formNode of formNodes ) {
		const styleVariables = generateStyleVariables( formNode );

		if ( ! styleVariables ) {
			return;
		}

		for ( const styleVariablesKey in styleVariables ) {
			formNode.style.setProperty( styleVariablesKey, styleVariables[ styleVariablesKey ] );
		}
	}
}

function initFullscreenMode() {
	// Check for fullscreen query parameter
	const urlParams = new URLSearchParams( window.location.search );
	const fullscreenParam = urlParams.get( 'fullscreen' );

	if ( ! fullscreenParam ) {
		return;
	}

	const formId = fullscreenParam === 'true' ? null : fullscreenParam;
	const forms = document.querySelectorAll( '.contact-form' );

	forms.forEach( form => {
		// If formId is specified, only transform that specific form
		if ( formId && form.id !== `contact-form-${ formId }` ) {
			return;
		}

		transformToFullscreenForm( form );
	} );
}

function transformToFullscreenForm( form ) {
	// Create fullscreen container
	const fullscreenContainer = document.createElement( 'div' );
	fullscreenContainer.className = 'jetpack-contact-form-fullscreen';
	document.body.appendChild( fullscreenContainer );

	// Create progress bar
	const progressBar = document.createElement( 'div' );
	progressBar.className = 'jetpack-contact-form-progress';
	fullscreenContainer.appendChild( progressBar );

	// Move the form into the fullscreen container
	fullscreenContainer.appendChild( form );

	// Find all form fields (not hidden fields, buttons, or submit)
	const fields = Array.from( form.querySelectorAll( '.grunion-field-wrap' ) ).filter( field => {
		const input = field.querySelector( 'input, textarea, select' );
		return (
			input &&
			input.type !== 'hidden' &&
			input.type !== 'submit' &&
			! field.classList.contains( 'grunion-field-submit-wrap' )
		);
	} );

	// Find submit button wrap
	const submitWrap = form.querySelector( '.grunion-field-submit-wrap' );

	// Setup for step navigation
	let currentStep = 0;
	const totalSteps = fields.length;

	// Create step navigation controls
	const navControls = document.createElement( 'div' );
	navControls.className = 'jetpack-contact-form-nav';

	const prevButton = document.createElement( 'button' );
	prevButton.type = 'button';
	prevButton.className = 'jetpack-contact-form-prev';
	prevButton.textContent = '← Previous';
	prevButton.disabled = true;

	const nextButton = document.createElement( 'button' );
	nextButton.type = 'button';
	nextButton.className = 'jetpack-contact-form-next';
	nextButton.textContent = 'Next →';

	navControls.appendChild( prevButton );
	navControls.appendChild( nextButton );

	// Add error message area
	const errorContainer = document.createElement( 'div' );
	errorContainer.className = 'jetpack-contact-form-validation-errors';
	errorContainer.style.display = 'none';
	navControls.insertBefore( errorContainer, nextButton );

	// Hide all fields except the first one
	fields.forEach( ( field, index ) => {
		field.classList.add( 'jetpack-contact-form-step' );
		if ( index !== 0 ) {
			field.style.display = 'none';
		}
	} );

	// Hide submit wrap initially
	if ( submitWrap ) {
		submitWrap.style.display = 'none';
	}

	// Update progress bar
	const updateProgress = () => {
		const progress = ( ( currentStep + 1 ) / ( totalSteps + 1 ) ) * 100;
		progressBar.style.width = `${ progress }%`;
	};

	// Navigate to step
	const goToStep = step => {
		// Validate current field before proceeding
		if ( step > currentStep && ! validateField( fields[ currentStep ] ) ) {
			return false;
		}

		// Hide current step
		fields[ currentStep ].style.display = 'none';

		// Show new step
		currentStep = step;
		fields[ currentStep ].style.display = 'block';

		// Update buttons
		prevButton.disabled = currentStep === 0;

		// If last field, show submit instead of next
		if ( currentStep === totalSteps - 1 ) {
			nextButton.style.display = 'none';
			if ( submitWrap ) {
				submitWrap.style.display = 'block';
			}
		} else {
			nextButton.style.display = 'block';
			if ( submitWrap ) {
				submitWrap.style.display = 'none';
			}
		}

		// Update progress
		updateProgress();

		// Focus on field input
		const input = fields[ currentStep ].querySelector( 'input, textarea, select' );
		if ( input ) {
			setTimeout( () => input.focus(), 100 );
		}

		return true;
	};

	// Add event listeners for navigation
	prevButton.addEventListener( 'click', () => {
		if ( currentStep > 0 ) {
			goToStep( currentStep - 1 );
		}
	} );

	nextButton.addEventListener( 'click', () => {
		if ( currentStep < totalSteps - 1 ) {
			goToStep( currentStep + 1 );
		}
	} );

	// Add keyboard navigation
	document.addEventListener( 'keydown', e => {
		if ( e.key === 'Enter' && currentStep < totalSteps - 1 ) {
			e.preventDefault();
			goToStep( currentStep + 1 );
		}
	} );

	// Add form submit handler to validate all fields
	form.addEventListener( 'submit', e => {
		// Validate current field
		if ( ! validateField( fields[ currentStep ] ) ) {
			e.preventDefault();
			return;
		}

		// Check if all fields are valid
		let allValid = true;
		for ( let i = 0; i < fields.length; i++ ) {
			// Temporarily show field to validate
			const wasHidden = fields[ i ].style.display === 'none';
			if ( wasHidden ) {
				fields[ i ].style.display = 'block';
			}

			// Validate field
			if ( ! validateField( fields[ i ] ) ) {
				allValid = false;
				// Go to the first invalid field
				if ( i !== currentStep ) {
					goToStep( i );
				}

				// Hide other fields again
				for ( let j = 0; j < fields.length; j++ ) {
					if ( j !== i && fields[ j ].style.display !== 'none' ) {
						fields[ j ].style.display = 'none';
					}
				}

				break;
			}

			// Hide field again if it was hidden before
			if ( wasHidden ) {
				fields[ i ].style.display = 'none';
			}
		}

		if ( ! allValid ) {
			e.preventDefault();
		}
	} );

	// Append navigation controls to form
	form.appendChild( navControls );

	// Initialize first step
	updateProgress();

	// Add close button
	const closeButton = document.createElement( 'button' );
	closeButton.type = 'button';
	closeButton.className = 'jetpack-contact-form-close';
	closeButton.textContent = '×';
	closeButton.title = 'Close form';
	closeButton.addEventListener( 'click', () => {
		const url = new URL( window.location );
		url.searchParams.delete( 'fullscreen' );
		window.location.href = url.toString();
	} );
	fullscreenContainer.appendChild( closeButton );
}
