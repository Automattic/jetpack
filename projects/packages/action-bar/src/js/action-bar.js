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
 * Timer for hiding the snackbar
 * This is made a class variable so that existing timeouts can be reset when opening a new snackbar
 */
let snackbarTimer;

/**
 * Open the menu
 */
function openMoreMenu() {
	// Ensure snackbar is closed
	dismissSnackbar();
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
 * Shows an error message using the snackbar
 *
 * @param {string} msg - The error message to show
 */
function showErrorSnackbar( msg ) {
	// Ensure modal is closed
	closeModal();

	// Prep snackbar
	const snackbarContainer = document.querySelector( '.jetpack-action-bar__snackbar' );
	snackbarContainer.textContent = msg;
	_classAdd( snackbarContainer, 'error' );

	// Fade in
	_fadeInAndActivate( snackbarContainer );

	// Trigger events for this state
	eventsSnackbar();
}

/**
 * Fade out the snackbar after 4 seconds or on click
 */
function eventsSnackbar() {
	// Clear any existing timeouts
	clearTimeout( snackbarTimer );
	snackbarTimer = setTimeout( function () {
		dismissSnackbar();
	}, 3000 );
	// Remove snackbar on click
	_on( document.querySelector( '.jetpack-action-bar__snackbar' ), 'click', function () {
		dismissSnackbar();
	} );
}

/**
 * Dismiss the snackbar.
 */
function dismissSnackbar() {
	_fadeOutAndDeactivate( document.querySelector( '.jetpack-action-bar__snackbar' ) );
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
 * Handles messages from the wp.widgets.com action bar iframe sent using postMessage
 *
 * @param {object} event - the event passed from the action bar iframe
 */
function handleMessage( event ) {
	if ( event.data && typeof event.data === 'string' ) {
		try {
			const data = JSON.parse( event.data );
			switch ( data.action ) {
				case 'postLiked':
					showErrorSnackbar( window.actionBarConfig?.like_post_error );
					break;
				case 'postUnliked':
					showErrorSnackbar( window.actionBarConfig?.unlike_post_error );
					break;
				case 'followSite':
					showErrorSnackbar( window.actionBarConfig?.follow_site_error );
					break;
				case 'unfollowSite':
					showErrorSnackbar( window.actionBarConfig?.unfollow_site_error );
					break;
			}
		} catch {}
	}
}

/**
 * Initialize action bar
 */
function init() {
	eventsActionbar();
	eventsModalHeader();
	window.addEventListener( 'message', handleMessage );
}

if ( document.readyState === 'complete' ) {
	init();
} else {
	document.addEventListener( 'DOMContentLoaded', function () {
		init();
	} );
}
