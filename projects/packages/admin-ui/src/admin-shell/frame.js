/*
 * A page that isn't built with wp-build runs in its own same-origin iframe: its CSS and globals
 * stay there. The guest endpoint prints the frame's document; a bridge script in it reports where
 * the page's router went and which links the shell should open.
 */

/**
 * Add an iframe that loads a script member's page.
 *
 * @param {HTMLElement} parent         - Where the iframe goes.
 * @param {object}      options        - What to load.
 * @param {string}      options.src    - The frame document's URL, from the guest endpoint.
 * @param {string}      options.title  - Accessible name of the frame.
 * @param {Function}    options.onUrl  - Called with the frame's URL each time its router moves.
 * @param {Function}    options.onLink - Called with a link's URL; returns whether the shell opened it.
 * @return {object} `frame`, `loaded` (a promise) and `go( url )`, which moves the page's router to the URL's hash.
 */
export function mountFrame( parent, { src, title, onUrl, onLink } ) {
	const frame = document.createElement( 'iframe' );
	frame.title = title;
	frame.className = 'jetpack-admin-shell__frame';
	frame.style.cssText = 'display: block; flex: 1; width: 100%; height: 100%; border: 0;';
	frame.addEventListener( 'jetpack-admin-shell:frame-url', event => onUrl( event.detail ) );
	frame.addEventListener( 'jetpack-admin-shell:frame-link', event => {
		if ( onLink( event.detail ) ) {
			event.preventDefault();
		}
	} );
	const loaded = new Promise( resolve =>
		frame.addEventListener( 'load', resolve, { once: true } )
	);
	frame.src = src;
	parent.append( frame );

	const go = next => {
		const win = frame.contentWindow;
		const { hash } = new URL( next, location.href );
		if ( ! win || hash === win.location.hash ) {
			return;
		}
		win.history.replaceState( null, '', hash || win.location.pathname + win.location.search );
		// Without state, so its router re-reads the URL.
		win.dispatchEvent( new win.PopStateEvent( 'popstate', { state: null } ) );
	};

	return { frame, loaded, go };
}
