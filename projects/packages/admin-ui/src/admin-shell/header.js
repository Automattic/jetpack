/*
 * A stand-in for a page's header, drawn the moment the page is opened and removed once its app
 * renders the real one. Each page's header, and the CSS it uses, is saved whenever it is on
 * screen: the dashboards add most of their CSS from JavaScript, which hasn't run yet.
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

// Every rule that styles one of these classes, or defines design tokens, in grouping rules too.
const rulesFor = classNames => {
	const selectors = [ ...classNames ].map( name => `.${ CSS.escape( name ) }` );
	const pick = ( rules, fromStyleTag ) => {
		let css = '';
		for ( const rule of rules ) {
			if ( rule instanceof CSSStyleRule ) {
				const styled = selectors.some( selector => rule.selectorText.includes( selector ) );
				const definesTokens =
					fromStyleTag && [ ...rule.style ].some( name => name.startsWith( '--wpds-' ) );
				if ( styled || definesTokens ) {
					css += rule.cssText;
				}
			} else if ( rule.cssRules ) {
				const inner = pick( rule.cssRules, fromStyleTag );
				if ( inner ) {
					css += `${ rule.cssText.slice( 0, rule.cssText.indexOf( '{' ) ) }{${ inner }}`;
				}
			}
		}
		return css;
	};
	let css = '';
	for ( const sheet of document.styleSheets ) {
		try {
			css += pick( sheet.cssRules, sheet.ownerNode?.tagName === 'STYLE' );
		} catch {
			// A cross-origin stylesheet can't be read; it is a <link> that loads with the page anyway.
		}
	}
	return css;
};

// The header HTML last saved for each page in this document, so a check doesn't parse storage.
const savedHtml = new Map();

const readSaved = slug => {
	try {
		return JSON.parse( localStorage.getItem( storageKey( slug ) ) );
	} catch {
		return null;
	}
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
	const html = frame.outerHTML;
	if ( ! savedHtml.has( slug ) ) {
		savedHtml.set( slug, readSaved( slug )?.html );
	}
	if ( savedHtml.get( slug ) === html ) {
		return;
	}
	savedHtml.set( slug, html );
	// Walking every stylesheet takes a few milliseconds; keep it off the click that switches pages.
	( window.requestIdleCallback ?? setTimeout )( () => {
		const classNames = new Set(
			[ frame, ...frame.querySelectorAll( '[class]' ) ].flatMap( node => [ ...node.classList ] )
		);
		const css = rulesFor( classNames );
		log( 'header', `saved ${ slug }'s header with ${ Math.round( css.length / 1024 ) }KB of CSS` );
		try {
			localStorage.setItem( storageKey( slug ), JSON.stringify( { html, css } ) );
		} catch {
			// Storage full or blocked: the next opening shows a borrowed header instead.
		}
	} );
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
	const saved = readSaved( slug );
	const css = saved?.css;
	let html = saved?.html;
	let source = 'saved';
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
	if ( css ) {
		const style = document.createElement( 'style' );
		style.textContent = css;
		standIn.prepend( style );
	}
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
