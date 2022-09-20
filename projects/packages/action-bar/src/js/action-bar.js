import {
	_classAdd,
	_classRemove,
	_fadeInAndActivate,
	_fadeOutAndDeactivate,
	_focusable,
	_on,
} from './utils';
import '../scss/action-bar.scss';

/**
 * Open the menu
 */
function openMoreMenu() {
	// Show modal
	_fadeInAndActivate( document.querySelector( '.jetpack-action-bar__modal' ) );
	// Activate shade
	_classAdd( document.querySelector( '.jetpack-action-bar__shade' ), 'active' );
	// Activate action bar link
	_classAdd( document.querySelector( '.jetpack-action-bar__more' ), 'active' );
	// Trap focus
	modalTrapFocus();
}

// -------------------------------------------------------------
// EVENTS
// -------------------------------------------------------------
/**
 * Attach action bar events
 */
function eventsActionbar() {
	const moreEl = document.querySelector( '.jetpack-action-bar__more' );
	_on( moreEl, 'click', function ( e ) {
		e.preventDefault();
		// If modal is already showing, remove it
		if ( isModalActive() ) {
			closeModal();
		} else {
			// Show modal
			openMoreMenu();
		}
	} );
}

/**
 * Attach modal header events
 */
function eventsModalHeader() {
	// Close
	_on( document.querySelector( '.jetpack-action-bar__close' ), 'click', function ( e ) {
		e.preventDefault();
		closeModal();
	} );
	_on( document.querySelector( '.jetpack-action-bar__shade' ), 'click', function ( e ) {
		e.preventDefault();
		closeModal();
	} );
}

/**
 * Trap focus while the modal is open
 */
function modalTrapFocus() {
	// Get all focusable elements
	const focusable = _focusable( document.querySelector( '.jetpack-action-bar__modal' ) ),
		focusableFirst = focusable[ 0 ],
		focusableLast = focusable[ focusable.length - 1 ];
	// Move focus inside modal
	focusableFirst.focus();
	// Manage focus
	_on( document.querySelector( 'body' ), 'keydown', function ( e ) {
		// Manually keep focus inside modal when tabbing
		if ( 9 === e.which ) {
			if ( e.target === focusableLast && ! e.shiftKey ) {
				e.preventDefault();
				focusableFirst.focus();
				return false;
			} else if ( e.target === focusableFirst && e.shiftKey ) {
				e.preventDefault();
				focusableLast.focus();
				return false;
			}
			return true;
		}
	} );
}

/**
 * is modal showing
 *
 * @returns {boolean} true if the modal has the 'active' class
 */
function isModalActive() {
	const el = document.querySelector( '.jetpack-action-bar__modal' );
	return el && el.classList.contains( 'active' );
}

/**
 * Close modal
 */
function closeModal() {
	// Fade out shade
	_fadeOutAndDeactivate( document.querySelector( '.jetpack-action-bar__shade' ), 'active' );
	// Fade out modal
	_fadeOutAndDeactivate( document.querySelector( '.jetpack-action-bar__modal' ) );
	// Deactivate action bar link
	_classRemove( document.querySelector( '.jetpack-action-bar__more' ), 'active' );
	// Remove focus hijack
	_on( document.querySelector( 'body' ), 'keydown', {} );
	// Place focus back on action bar
	document.querySelector( '.jetpack-action-bar__more' ).focus();
}

/**
 * Initialize action bar
 */
function init() {
	eventsActionbar();
	eventsModalHeader();
}

if ( document.readyState === 'complete' ) {
	init();
} else {
	document.addEventListener( 'DOMContentLoaded', function () {
		init();
	} );
}
