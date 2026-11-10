/*
 * One member app kept alive in the document. Its container carries the contract test hooks:
 * `data-shell-page="<slug>"` and `data-shell-state="loading|ready|visible|hidden"`.
 */

const TRANSITIONS = {
	loading: [ 'ready' ],
	ready: [ 'visible', 'hidden' ],
	visible: [ 'hidden' ],
	hidden: [ 'visible' ],
};

/**
 * Wrap an app container.
 *
 * @param {string}      slug - Admin page slug.
 * @param {HTMLElement} el   - The app's mount element.
 * @return {object} The app.
 */
export function createApp( slug, el ) {
	el.dataset.shellPage = slug;
	el.dataset.shellState = 'loading';

	const app = {
		slug,
		el,
		get state() {
			return el.dataset.shellState;
		},
		to( next ) {
			if ( app.state === next ) {
				return;
			}
			if ( ! TRANSITIONS[ app.state ]?.includes( next ) ) {
				throw new Error( `Admin shell: ${ slug } can't go from ${ app.state } to ${ next }` );
			}
			el.dataset.shellState = next;
			// A loading app stays on screen so it fills in where it will be shown.
			el.style.display = next === 'hidden' ? 'none' : '';
			el.inert = next === 'hidden';
		},
		// Before it is ready, an app can only be put on or off screen, not change state.
		place( onScreen ) {
			if ( app.state === 'loading' ) {
				el.style.display = onScreen ? '' : 'none';
				return;
			}
			app.to( onScreen ? 'visible' : 'hidden' );
		},
	};
	return app;
}

/**
 * Resolve once the app has rendered its first route: a page heading in its container.
 *
 * @param {HTMLElement} el      - The app's mount element.
 * @param {number}      timeout - Milliseconds before giving up.
 * @return {Promise<void>} Resolves when rendered, rejects on timeout.
 */
export function whenRendered( el, timeout ) {
	const rendered = () => !! el.querySelector( 'h1' )?.textContent.trim();
	if ( rendered() ) {
		return Promise.resolve();
	}
	return new Promise( ( resolve, reject ) => {
		const observer = new MutationObserver( () => {
			if ( rendered() ) {
				observer.disconnect();
				clearTimeout( timer );
				resolve();
			}
		} );
		const timer = setTimeout( () => {
			observer.disconnect();
			reject( new Error( 'Admin shell: app did not render in time' ) );
		}, timeout );
		observer.observe( el, { childList: true, subtree: true, characterData: true } );
	} );
}
