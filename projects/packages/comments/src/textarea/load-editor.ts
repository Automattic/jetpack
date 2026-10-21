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
	// The first ancestor that paints a background.
	let background = '';
	for ( let node = box.parentElement; node && ! background; node = node.parentElement ) {
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
