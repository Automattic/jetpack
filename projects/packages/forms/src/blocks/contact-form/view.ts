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
	const modals = document.querySelectorAll(
		'.jetpack-contact-form-modal'
	) as NodeListOf< HTMLElement >;

	if ( ! modals || modals.length === 0 ) {
		return;
	}

	// Track if any modal is open to manage body class
	let hasOpenModal = false;

	function updateBodyClass() {
		hasOpenModal = Array.from( modals ).some( modal => modal.classList.contains( 'open' ) );

		if ( hasOpenModal ) {
			document.body.classList.add( 'jetpack-contact-form-modal-open' );
		} else {
			document.body.classList.remove( 'jetpack-contact-form-modal-open' );
		}
	}

	function openModal( modal: HTMLElement ) {
		// If the user is typing in a form, don't open the modal or has anything else focused.
		if ( modal.ownerDocument?.activeElement?.tagName !== 'BODY' ) {
			return;
		}

		modal.classList.add( 'open' );
		updateBodyClass();
	}

	function closeModal( modal: HTMLElement ) {
		modal.classList.remove( 'open' );
		updateBodyClass();
	}

	function closeModalOnEscapeKeydown( event: KeyboardEvent ) {
		if ( event.key === 'Escape' ) {
			// Close the topmost (last) open modal
			const openModals = Array.from( modals ).filter( modal => modal.classList.contains( 'open' ) );

			if ( openModals.length > 0 ) {
				closeModal( openModals[ openModals.length - 1 ] );
			}
		}
	}

	// Set up event handlers for each modal
	modals.forEach( modal => {
		const trigger = modal.getAttribute( 'data-trigger' ) || 'immediate';

		function closeOnBackdropClick( event: MouseEvent ) {
			if ( event.target === modal ) {
				closeModal( modal );
			}
		}

		modal.addEventListener( 'click', closeOnBackdropClick );

		// Handle "leave" trigger - open modal when cursor leaves the page
		if ( trigger === 'leave' ) {
			let hasLeftPage = false;

			function handleMouseLeave( event: MouseEvent ) {
				// Check if mouse is leaving the viewport (not just moving between elements)
				if ( ! event.relatedTarget && ! hasLeftPage ) {
					hasLeftPage = true;
					openModal( modal );
					// Remove listener after opening once
					modal.ownerDocument.activeElement?.removeEventListener( 'mouseleave', handleMouseLeave );
				}
			}

			modal.ownerDocument.activeElement?.addEventListener( 'mouseleave', handleMouseLeave );
		}
	} );

	// Auto-open modals with "immediate" trigger on load
	modals.forEach( modal => {
		const trigger = modal.getAttribute( 'data-trigger' ) || 'immediate';

		if ( trigger === 'immediate' ) {
			openModal( modal );
		}
	} );

	// Close on Escape key (shared handler)
	window.addEventListener( 'keydown', closeModalOnEscapeKeydown );
} );
