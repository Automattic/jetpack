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

	const setOnScreen = onScreen => {
		el.style.display = onScreen ? '' : 'none';
		el.inert = ! onScreen;
		app.styles.forEach( node => ( node.disabled = ! onScreen ) );
	};

	const app = {
		slug,
		el,
		// Stylesheets that apply only while the app is on screen.
		styles: [],
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
			setOnScreen( next !== 'hidden' );
		},
		// Before it is ready, an app can only be put on or off screen, not change state.
		place( onScreen ) {
			if ( app.state === 'loading' ) {
				setOnScreen( onScreen );
				return;
			}
			app.to( onScreen ? 'visible' : 'hidden' );
		},
		// After a switch, so keyboard and screen reader users start on the page they opened.
		focusHeading() {
			const heading = headingOf( el );
			if ( ! heading ) {
				return;
			}
			focusOn( heading );
			// The route a switch opens can render after this and replace the heading: follow it once.
			const observer = new MutationObserver( () => {
				const next = headingOf( el );
				if ( heading.isConnected || ! next ) {
					return;
				}
				stop();
				// eslint-disable-next-line @wordpress/no-global-active-element -- The shell owns the whole document.
				if ( document.activeElement === document.body ) {
					focusOn( next );
				}
			} );
			const timer = setTimeout( () => observer.disconnect(), FOLLOW_TIMEOUT );
			const stop = () => {
				observer.disconnect();
				clearTimeout( timer );
			};
			observer.observe( el, { childList: true, subtree: true } );
		},
	};
	return app;
}

// How long a focused heading is followed if the app replaces it.
const FOLLOW_TIMEOUT = 2000;

const headingOf = el => [ ...el.querySelectorAll( 'h1' ) ].find( h => h.textContent.trim() );

const focusOn = heading => {
	if ( ! heading.hasAttribute( 'tabindex' ) ) {
		heading.tabIndex = -1;
	}
	heading.focus( { preventScroll: true } );
};

/**
 * Resolve once the app has rendered its first route: a page heading in its container.
 *
 * @param {HTMLElement} el      - The app's mount element.
 * @param {number}      timeout - Milliseconds before giving up.
 * @return {Promise<void>} Resolves when rendered, rejects on timeout.
 */
export function whenRendered( el, timeout ) {
	const rendered = () => !! headingOf( el );
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
