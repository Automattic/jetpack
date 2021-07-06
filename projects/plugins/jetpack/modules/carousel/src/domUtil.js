/**
 * Internal dependencies
 */

import * as util from './util';

// Helper matches function (not a polyfill), compatible with IE 11.
export function matches( el, sel ) {
	if ( Element.prototype.matches ) {
		return el.matches( sel );
	}

	if ( Element.prototype.msMatchesSelector ) {
		return el.msMatchesSelector( sel );
	}
}

// Helper closest parent node function (not a polyfill) based on
// https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#Polyfill
export function closest( el, sel ) {
	if ( el.closest ) {
		return el.closest( sel );
	}

	let current = el;

	do {
		if ( matches( current, sel ) ) {
			return current;
		}
		current = current.parentElement || current.parentNode;
	} while ( current !== null && current.nodeType === 1 );

	return null;
}

export function hide( el ) {
	if ( el ) {
		el.style.display = 'none';
	}
}

export function show( el ) {
	if ( el ) {
		// Everything we show and hide in Carousel is currently a block,
		// so we can make this really straightforward.
		el.style.display = 'block';
	}
}

export function fade( el, start, end, callback ) {
	if ( ! el ) {
		return callback();
	}

	// Prepare for transition.
	// Ensure the item is in the render tree, in its initial state.
	el.style.removeProperty( 'display' );
	el.style.opacity = start;
	el.style.transition = 'opacity 0.2s';
	el.style.pointerEvents = 'none';

	const finished = function ( e ) {
		if ( e.target === el && e.propertyName === 'opacity' ) {
			el.style.removeProperty( 'transition' );
			el.style.removeProperty( 'opacity' );
			el.style.removeProperty( 'pointer-events' );
			el.removeEventListener( 'transitionend', finished );
			el.removeEventListener( 'transitioncancel', finished );
			callback();
		}
	};

	requestAnimationFrame( function () {
		// Double rAF for browser compatibility.
		requestAnimationFrame( function () {
			el.addEventListener( 'transitionend', finished );
			el.addEventListener( 'transitioncancel', finished );
			// Trigger transition.
			el.style.opacity = end;
		} );
	} );
}

export function fadeIn( el, callback ) {
	callback = callback || util.noop;
	fade( el, '0', '1', callback );
}

export function fadeOut( el, callback ) {
	callback = callback || util.noop;
	fade( el, '1', '0', function () {
		el.style.display = 'none';
		callback();
	} );
}

export function emitEvent( el, type, detail ) {
	var e;
	try {
		e = new CustomEvent( type, {
			bubbles: true,
			cancelable: true,
			detail: detail || null,
		} );
	} catch ( err ) {
		e = document.createEvent( 'CustomEvent' );
		e.initCustomEvent( type, true, true, detail || null );
	}
	el.dispatchEvent( e );
}

export function scrollToElement( el ) {
	if ( ! el || typeof el.scrollIntoView !== 'function' ) {
		return;
	}

	if ( 'scrollBehavior' in document.documentElement.style ) {
		el.scrollIntoView( { behavior: 'smooth' } );
	} else {
		el.scrollIntoView();
	}
}

export function getJSONAttribute( el, attr ) {
	if ( ! el || ! el.hasAttribute( attr ) ) {
		return undefined;
	}

	try {
		return JSON.parse( el.getAttribute( attr ) );
	} catch ( e ) {
		return undefined;
	}
}

export function convertToPlainText( html ) {
	const dummy = document.createElement( 'div' );
	dummy.textContent = html;
	return dummy.innerHTML;
}
