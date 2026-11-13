/*
 * A stand-in for a page, drawn the moment the page is opened and removed once its app renders:
 * its saved header and tabs, or another page's header with its title and subtitle. Each page's
 * header, and the CSS it uses, is saved whenever it is on screen: the dashboards add most of their
 * CSS from JavaScript, which hasn't run yet.
 */
import { log } from './debug';

const KEY_ROOT = 'jetpack-admin-shell-header:';
// The longest a stand-in stays up: an app showing no page heading would otherwise stay hidden.
const STAND_IN_TIMEOUT = 8000;

// Saved CSS names the page by this, not its body class, so another page can borrow it.
const PAGE_CLASS = 'jetpack-admin-shell-page';

let keyPrefix = KEY_ROOT;
let bodyClassOf = () => null;
const storageKey = slug => keyPrefix + slug;

/**
 * Set where headers are saved, and drop the ones an earlier release saved for this site and user.
 *
 * @param {string} prefix  - `jetpack-admin-shell-header:<blog>:<user>:<version>:`.
 * @param {object} members - Member config keyed by slug, for each page's body class.
 */
export function configureHeaders( prefix, members = {} ) {
	keyPrefix = prefix;
	bodyClassOf = slug => members[ slug ]?.bodyClass;
	const scope = prefix.split( ':' ).slice( 0, 3 ).join( ':' ) + ':';
	try {
		for ( const key of Object.keys( localStorage ) ) {
			const stale = key.startsWith( scope ) && ! key.startsWith( prefix );
			// Keys from before headers were saved per site and user have no blog ID.
			const unscoped = key.startsWith( KEY_ROOT ) && ! /^\d+:/.test( key.slice( KEY_ROOT.length ) );
			if ( stale || unscoped ) {
				localStorage.removeItem( key );
			}
		}
	} catch {
		// Blocked storage: nothing was saved either.
	}
}

// Stand-ins on screen, by page.
const standIns = new Map();

// Take a stand-in down and give its mount back.
const takeDown = ( slug, entry ) => {
	clearTimeout( entry.timer );
	if ( standIns.get( slug ) === entry ) {
		standIns.delete( slug );
	}
	if ( entry.standIn.isConnected ) {
		entry.standIn.remove();
		entry.el.style.visibility = '';
		log( 'header', `removed stand-in header for ${ slug }` );
	}
};

/**
 * Remove a page's stand-in header, if it has one.
 *
 * @param {string} slug - Page slug.
 */
export function removeHeader( slug ) {
	const entry = standIns.get( slug );
	if ( entry ) {
		takeDown( slug, entry );
	}
}

// A copy of the parts of `node` that hold one of `keep`, and of each kept element whole.
const pruned = ( node, keep ) => {
	const copy = node.cloneNode( false );
	for ( const child of node.children ) {
		if ( keep.includes( child ) ) {
			copy.append( child.cloneNode( true ) );
		} else if ( keep.some( kept => child.contains( kept ) ) ) {
			copy.append( pruned( child, keep ) );
		}
	}
	return copy;
};

// The app's page wrappers, empty, around a copy of its header and tab bar.
const frameOf = el => {
	const h1 = el.querySelector( 'h1' );
	const page = h1?.closest( '.admin-ui-navigable-region' );
	if ( ! page || ! el.contains( page ) ) {
		return null;
	}
	const header = [ ...page.children ].find( child => child.contains( h1 ) );
	const keep = [ header, page.querySelector( '[role="tablist"]' ) ].filter( Boolean );
	let frame = pruned( page, keep );
	for ( let node = page.parentElement; node !== el; node = node.parentElement ) {
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
	template.content
		.querySelectorAll( 'script, iframe, frame, object, embed, base, form' )
		.forEach( node => node.remove() );
	for ( const node of template.content.querySelectorAll( '*' ) ) {
		for ( const { name, value } of [ ...node.attributes ] ) {
			const runs = name.startsWith( 'on' ) || name === 'srcdoc' || /^\s*javascript:/i.test( value );
			if ( name === 'id' || runs ) {
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
		const bodyClass = bodyClassOf( slug );
		let css = rulesFor( classNames );
		if ( bodyClass ) {
			// Dashboards scope their page layout to WordPress's per-page body class.
			css = css.replace( new RegExp( `\\b${ bodyClass }(?![\\w-])`, 'g' ), PAGE_CLASS );
		}
		log( 'header', `saved ${ slug }'s header with ${ Math.round( css.length / 1024 ) }KB of CSS` );
		try {
			localStorage.setItem( storageKey( slug ), JSON.stringify( { html, css } ) );
		} catch {
			// Storage full or blocked: the next opening shows no stand-in.
		}
	} );
}

// A saved standard page header: a custom one's styles don't survive having parts taken out.
const donor = () => {
	try {
		const entries = Object.keys( localStorage )
			.filter( key => key.startsWith( keyPrefix ) )
			.sort()
			.map( key => [ key, localStorage.getItem( key ) ] )
			.filter( ( [ , value ] ) => value.includes( '__header-title' ) );
		const has = ( ...marks ) =>
			entries.find( ( [ , value ] ) => marks.every( mark => value.includes( mark ) ) );
		// `JetpackLogo` as it last rendered, so this file needs no copy of it, best with a subtitle row.
		const [ key ] =
			has( 'jetpack-logo', '__header-subtitle' ) ?? has( 'jetpack-logo' ) ?? entries[ 0 ] ?? [];
		return key ? readSaved( key.slice( keyPrefix.length ) ) : null;
	} catch {
		return null;
	}
};

// CSS modules hash only a class name's prefix; these are found by their `__<name>` ending.
const ROW_CLASSES = [ 'header-subtitle', 'body-md' ];
let rowClasses = null;

// The classes of a subtitle row, from the styles on the page: one walk, then remembered.
const findRowClasses = () => {
	const pattern = new RegExp( `\\.([\\w-]+__(${ ROW_CLASSES.join( '|' ) }))(?![\\w-])`, 'g' );
	const found = {};
	const search = rules => {
		for ( const rule of rules ) {
			for ( const [ , name, suffix ] of rule.selectorText?.matchAll( pattern ) ?? [] ) {
				found[ suffix ] ??= name;
			}
			if ( rule.cssRules ) {
				search( rule.cssRules );
			}
		}
	};
	for ( const sheet of document.styleSheets ) {
		try {
			search( sheet.cssRules );
		} catch {
			// A cross-origin stylesheet can't be read.
		}
	}
	// Not remembered when missing: the styles may still be on their way.
	const all = ROW_CLASSES.map( suffix => found[ suffix ] );
	return all.includes( undefined ) ? null : all;
};

/*
 * A subtitle row as admin-ui's Page renders it, for a copy saved without one. Any page header on
 * screen has added its styles, with or without a subtitle; before that, there is no row.
 */
const subtitleRow = copy => {
	const content = copy.querySelector( '[class*="__header-content"]' );
	rowClasses ??= content && findRowClasses();
	if ( ! content || ! rowClasses ) {
		return null;
	}
	// The heading's text and element-reset classes, without its size and role.
	const shared = [ ...copy.querySelector( 'h1' ).classList ].filter(
		name => ! /__(heading-\w+|header-title)$/.test( name )
	);
	const row = document.createElement( 'p' );
	row.className = [ ...shared, ...rowClasses ].join( ' ' );
	content.after( row );
	return row;
};

// Give a header copy this page's title, and its subtitle or none.
const retitle = ( copy, { title, subtitle } ) => {
	copy.querySelector( 'h1' ).textContent = title;
	const row = copy.querySelector( '[class*="__header-subtitle"]' );
	if ( ! subtitle ) {
		row?.remove();
		return;
	}
	const target = row ?? subtitleRow( copy );
	if ( target ) {
		target.textContent = subtitle;
	}
};

/**
 * Show a stand-in for a page in front of its app until the app renders.
 *
 * @param {string}      slug     - Page being opened.
 * @param {HTMLElement} el       - Its mount element; the stand-in goes right before it.
 * @param {string}      title    - Page heading, for a borrowed header.
 * @param {object|null} declared - `title` and `subtitle` of the view being opened, when the page
 *                               declares them: they replace those of any header shown.
 * @return {Function} Removes the stand-in.
 */
export function showHeader( slug, el, title, declared = null ) {
	const own = readSaved( slug );
	const saved = own ?? ( title ? donor() : null );
	if ( ! saved?.html ) {
		log( 'header', `no saved header for ${ slug }` );
		return () => {};
	}
	const copy = inertCopy( saved.html );
	if ( ! own ) {
		// Another page's: only its icon and layout are this page's too.
		copy
			.querySelectorAll( '[role="tablist"], [class*="__header-actions"]' )
			.forEach( node => node.remove() );
	}
	if ( ! own || declared ) {
		retitle( copy, declared ?? { title } );
	}
	const css = saved.css?.replaceAll( PAGE_CLASS, bodyClassOf( slug ) ?? PAGE_CLASS );

	// A section for the same reason the guest containers are one (see bootGuest in index.js).
	const standIn = document.createElement( 'section' );
	standIn.className = el.className;
	standIn.dataset.shellHeader = slug;
	standIn.inert = true;
	standIn.setAttribute( 'aria-hidden', 'true' );
	standIn.append( copy );
	if ( css ) {
		const style = document.createElement( 'style' );
		style.textContent = css;
		standIn.prepend( style );
	}
	el.before( standIn );
	// The empty mount can be styled as a blank page that would cover the stand-in.
	el.style.visibility = 'hidden';
	log( 'header', `showing ${ own ? 'its saved' : 'a borrowed' } header for ${ slug }` );

	removeHeader( slug );
	const entry = { standIn, el, timer: 0 };
	entry.timer = setTimeout( () => takeDown( slug, entry ), STAND_IN_TIMEOUT );
	standIns.set( slug, entry );
	return () => takeDown( slug, entry );
}
