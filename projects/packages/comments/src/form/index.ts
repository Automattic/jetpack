/**
 * Fetches the comment form when the reader gets near it. Comment forms sit
 * below the fold on nearly every page, so most visits never need the bundle at
 * all, and this is all that ships on the ones that do.
 */

import './public-path';

// The styles ship eagerly, with the page. Left to the chunk they would be
// emitted as chunk CSS, which webpack's loader fetches without the .rtl.css
// half, so every right-to-left locale would silently get the LTR sheet.
import './style.scss';
import '../identity/style.scss';
import '../identity/checkpoint/style.scss';
import '../ui/style.scss';

// Far enough ahead that the chunk has usually arrived by the time the form is
// on screen, so the wait is spent scrolling rather than looking at a gap.
const ROOT_MARGIN = '600px';

/**
 * Fetch the form and draw it.
 *
 * @param element - The mount point.
 */
const load = ( element: HTMLElement ) => {
	import( /* webpackChunkName: "comments-form" */ './mount' ).then(
		( { mount } ) => mount( element ),
		// A chunk that never arrives leaves the reader exactly where a script that
		// failed to load already left them, and there is nothing useful to say.
		() => {}
	);
};

const elements = document.querySelectorAll< HTMLElement >( '.jetpack-comments' );

if ( typeof IntersectionObserver === 'undefined' ) {
	elements.forEach( load );
} else {
	const observer = new IntersectionObserver(
		entries =>
			entries.forEach( entry => {
				if ( ! entry.isIntersecting ) {
					return;
				}

				observer.unobserve( entry.target );
				load( entry.target as HTMLElement );
			} ),
		{ rootMargin: ROOT_MARGIN }
	);

	elements.forEach( element => observer.observe( element ) );
}
