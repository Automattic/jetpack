import './util/form-styles';
import domReady from '@wordpress/dom-ready';

const { generateStyleVariables } = window.jetpackForms;
const FRONTEND_SELECTOR = '.wp-block-jetpack-contact-form-container';

//Fallback in case of the page load event takes too long to fire up
const fallbackTimer = setTimeout( () => {
	handleFormStyles();
}, 3000 );

window.addEventListener( 'load', () => {
	clearTimeout( fallbackTimer );
	handleFormStyles();
} );

function handleFormStyles() {
	const formNodes = document.querySelectorAll( FRONTEND_SELECTOR ) as NodeListOf< HTMLElement >;

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

// Modal functionality
domReady( () => {
	const modal = document.querySelector( '.jetpack-contact-form-modal' ) as HTMLElement;
	if ( ! modal ) {
		return;
	}

	function openModal() {
		// If the user is typing in a form, don't open the modal or has anything else focused.
		if ( modal.ownerDocument?.activeElement?.tagName !== 'BODY' ) {
			return;
		}

		modal.classList.add( 'open' );
		document.body.classList.add( 'jetpack-contact-form-modal-open' );
	}

	function closeModal() {
		modal.classList.remove( 'open' );
		document.body.classList.remove( 'jetpack-contact-form-modal-open' );
	}

	function closeModalOnEscapeKeydown( event: KeyboardEvent ) {
		if ( event.key === 'Escape' ) {
			closeModal();
		}
	}

	function closeOnWindowClick( event: MouseEvent ) {
		if ( event.target === modal ) {
			closeModal();
		}
	}

	// Auto-open on load for testing (minimal implementation)
	openModal();

	// Close on Escape key
	window.addEventListener( 'keydown', closeModalOnEscapeKeydown );

	// Close on backdrop click
	window.addEventListener( 'click', closeOnWindowClick );
} );
