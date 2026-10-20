import type { LocaleData } from '@wordpress/i18n';

// Shared by every form on the page. A failure clears it, so the next reach tries again.
let editorModule: Promise< typeof import( '../editor' ) > | null = null;

export const loadEditor = ( locale?: LocaleData ) => {
	// The chunk reads its translations as it loads.
	if ( locale ) {
		window.jetpackCommentsEditorLocale = locale;
	}
	editorModule ??= import( /* webpackChunkName: "editor" */ '../editor' ).catch( error => {
		editorModule = null;
		throw error;
	} );

	return editorModule;
};

// Started when a reader reaches for the box, so it is often there by the time they click.
export const preloadEditor = () => {
	loadEditor( JetpackComments.editorLocale ).catch( () => undefined );
};

/**
 * Hand the editor the theme's type from its textarea and the colours around the box.
 * Read as the editor opens, so a stylesheet that loads late has arrived.
 *
 * @param box      - The comment box.
 * @param textarea - The theme-styled textarea in it.
 */
export const matchTheme = ( box: HTMLElement, textarea: HTMLTextAreaElement ) => {
	const { fontFamily, fontSize, lineHeight } = getComputedStyle( textarea );
	const { color } = getComputedStyle( box );
	// The first that paints a background: the box itself when it took the theme's fill.
	let background = '';
	for ( let node: HTMLElement | null = box; node && ! background; node = node.parentElement ) {
		const { backgroundColor } = getComputedStyle( node );
		if ( backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent' ) {
			background = backgroundColor;
		}
	}

	// Every read before any write, so the page restyles once.
	box.style.setProperty( '--jetpack-comments-font-family', fontFamily );
	box.style.setProperty( '--jetpack-comments-font-size', fontSize );
	box.style.setProperty( '--jetpack-comments-line-height', lineHeight );
	box.style.setProperty( '--jetpack-comments-color', color );
	if ( background ) {
		box.style.setProperty( '--jetpack-comments-background', background );
	}
};

const channels = ( color: string ) =>
	color
		.match( /^rgba?\(([^)]+)\)$/ )?.[ 1 ]
		.split( /[\s,/]+/ )
		.map( Number );

const luminance = ( [ r, g, b ]: number[] ) =>
	[ r, g, b ]
		.map( value =>
			value / 255 <= 0.03928 ? value / 255 / 12.92 : ( ( value / 255 + 0.055 ) / 1.055 ) ** 2.4
		)
		.reduce( ( sum, value, i ) => sum + value * [ 0.2126, 0.7152, 0.0722 ][ i ], 0 );

const contrast = ( a: number[], b: number[] ) => {
	const [ light, dark ] = [ luminance( a ), luminance( b ) ].sort( ( x, y ) => y - x );
	return ( light + 0.05 ) / ( dark + 0.05 );
};

/**
 * Give the box the theme's textarea fill, as core's textarea would show it, and the
 * theme's textarea text colour only where the post's own would not read on that fill.
 *
 * @param box      - The comment box.
 * @param textarea - The theme-styled textarea in it.
 */
export const matchFill = ( box: HTMLElement, textarea: HTMLTextAreaElement ) => {
	// Ours makes the textarea transparent; lifted for this one read.
	textarea.classList.add( 'is-reading-fill' );
	const { backgroundColor, color: ink } = getComputedStyle( textarea );
	textarea.classList.remove( 'is-reading-fill' );

	const fill = channels( backgroundColor );
	if ( ! fill || ( fill[ 3 ] ?? 1 ) < 0.99 ) {
		return;
	}
	const own = channels( getComputedStyle( box ).color );
	box.style.setProperty( '--jetpack-comments-fill', backgroundColor );

	// A see-through colour reads as nothing; Monotone sets its text fully transparent.
	const reads = ( color?: number[] ) =>
		color && ( color[ 3 ] ?? 1 ) >= 0.99 ? contrast( color, fill ) : 1;
	if ( reads( own ) < 3 && reads( channels( ink ) ) > reads( own ) ) {
		box.style.setProperty( '--jetpack-comments-ink', ink );
		box.dataset.ink = '';
	}
};
