/**
 * Add class to element
 *
 * @param {Element} el - element
 * @param {string} className - class to add
 */
export function _classAdd( el, className ) {
	if ( ! _exists( el ) || ! className ) {
		return;
	}
	if ( el.classList.contains( className ) ) {
		return;
	}
	el.classList.add( className );
}

/**
 * Remove class from element
 *
 * @param {Element} el - element
 * @param {string} className - class to remove
 * @returns {boolean} status
 */
export function _classRemove( el, className ) {
	if ( ! _exists( el ) || ! className ) {
		return false;
	}
	return el.classList.remove( className );
}

/**
 * Fade element in and then apply 'active' class
 *
 * @param {Element} el - element to fade in
 */
export function _fadeInAndActivate( el ) {
	if ( ! _exists( el ) ) {
		return;
	}
	_classAdd( el, 'active' );
	el.style.opacity = 1;
}

/**
 * Fade element out and remove 'active' class
 *
 * @param {Element} el - element to fade out
 */
export function _fadeOutAndDeactivate( el ) {
	if ( ! _exists( el ) ) {
		return;
	}
	el.style.opacity = 0;
	setTimeout( function () {
		_classRemove( el, 'active' );
	}, 300 );
}

/**
 * Check to see if element exists
 *
 * @param {Element} el - element
 * @returns {boolean} true if element exists
 */
export function _exists( el ) {
	return typeof el !== 'undefined' && el != null && el.length !== 0;
}

/**
 * Get all focussable elements
 *
 * @param {Element} el - element
 * @returns {Element} array of all focusable elements
 */
export function _focusable( el ) {
	const focusable = el.querySelectorAll(
			'a[href], button, input, textarea, select,[tabindex]:not([tabindex="-1"])'
		),
		focusableArr = Array.from( focusable );
	for ( let i = 0; i < focusableArr.length; i++ ) {
		if ( focusableArr[ i ].style.display === 'none' ) {
			focusableArr.splice( i, 1 );
		}
	}
	return focusableArr;
}

/**
 * On event handler
 *
 * @param {Element} el - element
 * @param {string} event - event name
 * @param {Function} fn - callback
 */
export function _on( el, event, fn ) {
	if ( ! _exists( el ) || ! event || ! fn ) {
		return;
	}
	el.addEventListener( event, fn );
}
