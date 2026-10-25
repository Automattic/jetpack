import { readFileSync } from 'fs';
import path from 'path';

const modalCss = readFileSync( path.join( __dirname, '../subscribe-modal.css' ), 'utf8' );

// jsdom does not resolve var(), so substitute the theme's color presets the way a browser would.
const withPresets = ( css, presets ) => {
	const resolved = css.replace(
		/var\(--wp--preset--color--([\w-]+), ([^()]+)\)/g,
		( _, slug, fallback ) => presets[ slug ] ?? fallback
	);
	return resolved === css ? css : withPresets( resolved, presets );
};

describe( 'Subscribe modal', () => {
	let style;

	afterEach( () => {
		style.remove();
		document.body.innerHTML = '';
	} );

	// Twenty Twenty-Four colors its page, headings and links from the base and contrast presets.
	// The link rule uses a:link because jsdom ranks its own a:link color above weaker page rules.
	it.each( [
		[ 'dark', '#38629F', '#FFFFFF', 'rgb(56, 98, 159)', 'rgb(255, 255, 255)' ],
		[ 'light', '#f9f9f9', '#111111', 'rgb(249, 249, 249)', 'rgb(17, 17, 17)' ],
	] )(
		'keeps the heading, text and close link readable on a %s theme style',
		( _, base, contrast, expectedBackground, expectedText ) => {
			style = document.createElement( 'style' );
			style.textContent =
				`body { background-color: ${ base }; color: ${ contrast }; }
				h2, a:link { color: ${ contrast }; }` + withPresets( modalCss, { base, contrast } );
			document.head.appendChild( style );
			document.body.innerHTML = `
				<div class="jetpack-subscribe-modal open">
					<div class="jetpack-subscribe-modal__modal-content">
						<div class="wp-block-group">
							<h2>Discover more</h2>
							<p>Subscribe to get the latest posts.</p>
							<p class="jetpack-subscribe-modal__close"><a href="#">Continue reading</a></p>
						</div>
					</div>
				</div>`;

			const content = document.querySelector( '.jetpack-subscribe-modal__modal-content' );
			const colorOf = selector => getComputedStyle( content.querySelector( selector ) ).color;
			expect( {
				background: getComputedStyle( content ).backgroundColor,
				heading: colorOf( 'h2' ),
				text: colorOf( 'p' ),
				link: colorOf( 'a' ),
			} ).toEqual( {
				background: expectedBackground,
				heading: expectedText,
				text: expectedText,
				link: expectedText,
			} );
		}
	);
} );
