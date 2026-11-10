/*
 * A stand-in for a page's header, drawn the moment the page is opened and removed once its app
 * renders the real one. Each page's header is saved whenever it is on screen, for next time.
 */
import { log } from '@automattic/jetpack-admin-shell/debug'; // eslint-disable-line import/no-unresolved -- Resolved by the import map.

const storageKey = slug => `jetpack-admin-shell-header:${ slug }`;

// The app's page wrappers, empty, around a copy of its header.
const frameOf = el => {
	const h1 = el.querySelector( 'h1' );
	const page = h1?.closest( '.admin-ui-navigable-region' );
	if ( ! page || ! el.contains( page ) ) {
		return null;
	}
	let frame = [ ...page.children ].find( child => child.contains( h1 ) ).cloneNode( true );
	for ( let node = page; node !== el; node = node.parentElement ) {
		const wrapper = node.cloneNode( false );
		wrapper.append( frame );
		frame = wrapper;
	}
	return frame;
};

// The copy is for looking at only: no ids to collide with the real app's, nothing that runs.
const inertCopy = html => {
	const template = document.createElement( 'template' );
	template.innerHTML = html;
	template.content.querySelectorAll( 'script' ).forEach( node => node.remove() );
	for ( const node of template.content.querySelectorAll( '*' ) ) {
		for ( const { name } of [ ...node.attributes ] ) {
			if ( name === 'id' || name.startsWith( 'on' ) ) {
				node.removeAttribute( name );
			}
		}
	}
	return template.content;
};

/**
 * Save the header an app has on screen, so its next opening can show it straight away.
 *
 * @param {string}      slug - Page slug.
 * @param {HTMLElement} el   - The app's mount element.
 */
export function rememberHeader( slug, el ) {
	const frame = frameOf( el );
	if ( ! frame ) {
		return;
	}
	try {
		localStorage.setItem( storageKey( slug ), frame.outerHTML );
	} catch {
		// Storage full or blocked: the next opening shows a borrowed header instead.
	}
}

/**
 * Show a page's header in front of its app until the app renders.
 *
 * Uses the page's saved header, or else the header on screen with the page's title in it.
 *
 * @param {string}      slug           - Page being opened.
 * @param {HTMLElement} el             - Its mount element; the stand-in goes right before it.
 * @param {object}      fallback       - Used when nothing was saved for this page.
 * @param {HTMLElement} fallback.from  - Mount element of the app on screen.
 * @param {string}      fallback.title - Title to put in that header.
 * @return {Function} Removes the stand-in.
 */
export function showHeader( slug, el, { from, title } = {} ) {
	let html = null;
	let source = 'saved';
	try {
		html = localStorage.getItem( storageKey( slug ) );
	} catch {
		// Blocked storage: fall through to the borrowed header.
	}
	if ( ! html && from ) {
		const frame = frameOf( from );
		if ( frame ) {
			frame.querySelector( 'h1' ).textContent = title;
			// Actions and tabs belong to the other page.
			frame
				.querySelectorAll( 'button, a, input, select, [role="tablist"]' )
				.forEach( node => node.remove() );
			html = frame.outerHTML;
			source = 'borrowed';
		}
	}
	if ( ! html ) {
		log( 'header', `no header to show for ${ slug }` );
		return () => {};
	}

	// A section for the same reason the guest containers are one (see bootGuest in index.js).
	const standIn = document.createElement( 'section' );
	standIn.className = el.className;
	standIn.dataset.shellHeader = slug;
	standIn.inert = true;
	standIn.setAttribute( 'aria-hidden', 'true' );
	standIn.append( inertCopy( html ) );
	el.before( standIn );
	// The empty mount can be styled as a blank page that would cover the stand-in.
	el.style.visibility = 'hidden';
	log( 'header', `showing ${ source } header for ${ slug }` );

	return () => {
		if ( standIn.isConnected ) {
			standIn.remove();
			el.style.visibility = '';
			log( 'header', `removed stand-in header for ${ slug }` );
		}
	};
}
