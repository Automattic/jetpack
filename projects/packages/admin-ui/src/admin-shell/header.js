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

let storageKey = KEY_ROOT;
let bodyClassOf = () => null;

// When the shell last ran for each `<blog>:<user>`, so another site's or user's headers can expire.
const SEEN_KEY = KEY_ROOT + 'seen';
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const REFRESH_SEEN = 24 * 60 * 60 * 1000;

// `<blog>:<user>` of a key, or null for one saved before headers were per site and user.
const scopeOf = key => key.slice( KEY_ROOT.length ).match( /^(\d+:\d+):/ )?.[ 1 ] ?? null;

const readSeen = () => {
	try {
		const seen = JSON.parse( localStorage.getItem( SEEN_KEY ) );
		return isObject( seen ) ? seen : {};
	} catch {
		return {};
	}
};

/**
 * Set where headers are saved, and drop the saved headers nothing will show again.
 *
 * @param {string} prefix  - `jetpack-admin-shell-header:<blog>:<user>:<version>:<session>:`.
 * @param {object} members - Member config keyed by slug, for each page's body class.
 */
export function configureHeaders( prefix, members = {} ) {
	storageKey = prefix;
	bodyClassOf = slug => members[ slug ]?.bodyClass;
	window.addEventListener( 'storage', forgetSaved );
	const own = scopeOf( prefix );
	const now = Date.now();
	try {
		const seen = readSeen();
		const live = new Set( [ own ] );
		for ( const key of Object.keys( localStorage ) ) {
			if ( ! key.startsWith( KEY_ROOT ) || key === SEEN_KEY || key === prefix ) {
				continue;
			}
			const scope = scopeOf( key );
			// A scope first met here expires a full age from now.
			if ( scope && scope !== own ) {
				seen[ scope ] ??= now;
			}
			// This scope's other releases, logins and layouts; another's no one has opened lately.
			if ( ! scope || scope === own || now - seen[ scope ] > MAX_AGE ) {
				localStorage.removeItem( key );
			} else {
				live.add( scope );
			}
		}
		// Once a day is precise enough for a 30-day age, and keeps page loads from writing.
		if ( ! ( now - seen[ own ] < REFRESH_SEEN ) ) {
			seen[ own ] = now;
		}
		const kept = JSON.stringify(
			Object.fromEntries( Object.entries( seen ).filter( ( [ scope ] ) => live.has( scope ) ) )
		);
		if ( kept !== localStorage.getItem( SEEN_KEY ) ) {
			localStorage.setItem( SEEN_KEY, kept );
		}
	} catch {
		// Blocked or full storage: nothing more will be saved either.
	}
	if ( Object.keys( members ).length ) {
		const store = readStore();
		const gone = Object.keys( store.pages ).filter( slug => ! Object.hasOwn( members, slug ) );
		gone.forEach( slug => delete store.pages[ slug ] );
		if ( gone.length ) {
			write( store );
		}
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

const isObject = value => value && typeof value === 'object' && ! Array.isArray( value );
const isPage = page =>
	isObject( page ) &&
	typeof page.html === 'string' &&
	Array.isArray( page.css ) &&
	Array.isArray( page.styles );

/*
 * All pages are saved under one key, with each CSS rule and style attribute value saved once as a
 * piece: the dashboards share most of them. Anything not in this shape is dropped as unsaved.
 */
const readStore = () => {
	let stored;
	try {
		stored = JSON.parse( localStorage.getItem( storageKey ) );
	} catch {
		// Blocked storage, or not JSON: nothing is saved.
	}
	const pick = ( value, keep ) =>
		Object.fromEntries( Object.entries( isObject( value ) ? value : {} ).filter( keep ) );
	return {
		pieces: pick( stored?.pieces, ( [ , text ] ) => typeof text === 'string' ),
		pages: pick( stored?.pages, ( [ , page ] ) => isPage( page ) ),
	};
};

// Name each piece by the id the same text already has, or a new one.
const namer = pieces => {
	const ids = new Map( Object.entries( pieces ).map( ( [ id, text ] ) => [ text, id ] ) );
	const taken = Object.keys( pieces )
		.map( id => parseInt( id, 36 ) )
		.filter( Number.isFinite );
	let next = Math.max( -1, ...taken ) + 1;
	return text => {
		let id = ids.get( text );
		if ( id === undefined ) {
			id = ( next++ ).toString( 36 );
			ids.set( text, id );
			pieces[ id ] = text;
		}
		return id;
	};
};

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
	// A screen that hides its header, such as Boost's Getting Started, would lend other pages an invisible one.
	if ( ! page || ! el.contains( page ) || h1.checkVisibility?.() === false ) {
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

/*
 * Every rule that styles one of these classes, or defines design tokens, each inside its own copy of
 * its grouping rules so pages that share it save the same text.
 */
const rulesFor = classNames => {
	const selectors = [ ...classNames ].map( name => `.${ CSS.escape( name ) }` );
	const found = [];
	const pick = ( rules, wrap, fromStyleTag, into ) => {
		for ( const rule of rules ) {
			if ( rule instanceof CSSStyleRule ) {
				const styled = selectors.some( selector => rule.selectorText.includes( selector ) );
				const definesTokens =
					fromStyleTag && [ ...rule.style ].some( name => name.startsWith( '--wpds-' ) );
				if ( styled || definesTokens ) {
					into.push( wrap( rule.cssText ) );
				}
			} else if ( rule.cssRules ) {
				const head = rule.cssText.slice( 0, rule.cssText.indexOf( '{' ) );
				// Each anonymous `@layer` block is a layer of its own, so its rules stay in one.
				if ( head.trim() === '@layer' ) {
					const inner = [];
					pick( rule.cssRules, css => css, fromStyleTag, inner );
					if ( inner.length ) {
						into.push( wrap( `${ head }{${ inner.join( '' ) }}` ) );
					}
				} else {
					pick( rule.cssRules, css => wrap( `${ head }{${ css }}` ), fromStyleTag, into );
				}
			}
		}
	};
	for ( const sheet of document.styleSheets ) {
		try {
			pick( sheet.cssRules, css => css, sheet.ownerNode?.tagName === 'STYLE', found );
		} catch {
			// A cross-origin stylesheet can't be read; it is a <link> that loads with the page anyway.
		}
	}
	return found;
};

// The header HTML last saved for each page in this document, so a check doesn't parse storage.
const savedHtml = new Map();

// Another tab's save can drop or replace this tab's, so check storage again on the next save.
const forgetSaved = event => {
	if ( event.key === storageKey || event.key === null ) {
		savedHtml.clear();
	}
};

// A page's saved header with its pieces filled in.
const readSaved = ( slug, { pieces, pages } = readStore() ) => {
	const page = pages[ slug ];
	if ( ! page ) {
		return null;
	}
	const template = document.createElement( 'template' );
	template.innerHTML = page.html;
	for ( const node of template.content.querySelectorAll( '[style]' ) ) {
		node.setAttribute( 'style', pieces[ node.getAttribute( 'style' ) ] ?? '' );
	}
	return { html: template.innerHTML, css: page.css.map( id => pieces[ id ] ?? '' ).join( '' ) };
};

// A header frame as it is saved: each style attribute's value replaced by its piece id.
const withPieceIds = ( frame, add ) => {
	const copy = frame.cloneNode( true );
	const styles = [ copy, ...copy.querySelectorAll( '[style]' ) ]
		.filter( node => node.hasAttribute( 'style' ) )
		.map( node => {
			const id = add( node.getAttribute( 'style' ) );
			node.setAttribute( 'style', id );
			return id;
		} );
	return { html: copy.outerHTML, styles };
};

// Save the pages, keeping only the pieces some page uses.
const write = ( { pieces, pages } ) => {
	const used = {};
	for ( const { css, styles } of Object.values( pages ) ) {
		for ( const id of [ ...css, ...styles ] ) {
			used[ id ] = pieces[ id ];
		}
	}
	try {
		localStorage.setItem( storageKey, JSON.stringify( { pieces: used, pages } ) );
	} catch {
		// Storage full or blocked: the next opening shows no stand-in.
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
		const { pieces, pages } = readStore();
		const page = pages[ slug ];
		// Compared as saved, so markup the HTML parser would rearrange still matches.
		const same =
			page?.html === withPieceIds( frame, namer( { ...pieces } ) ).html &&
			[ ...page.css, ...page.styles ].every( id => Object.hasOwn( pieces, id ) );
		savedHtml.set( slug, same ? html : undefined );
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
		// Dashboards scope their page layout to WordPress's per-page body class.
		const pageScoped = bodyClass && new RegExp( `\\b${ bodyClass }(?![\\w-])`, 'g' );
		const rules = rulesFor( classNames ).map( rule =>
			pageScoped ? rule.replace( pageScoped, PAGE_CLASS ) : rule
		);
		// Read after the walk, right before writing, so what another tab saved meanwhile is kept.
		const store = readStore();
		const add = namer( store.pieces );
		const { html: savedAs, styles } = withPieceIds( frame, add );
		const css = rules.map( add );
		log( 'header', `saved ${ slug }'s header with ${ css.length } CSS rules` );
		store.pages[ slug ] = { html: savedAs, css, styles };
		write( store );
	} );
}

// A saved standard page header: a custom one's styles don't survive having parts taken out.
const donor = store => {
	const entries = Object.entries( store.pages )
		.sort( ( [ a ], [ b ] ) => ( a < b ? -1 : 1 ) )
		// The markup only: the saved CSS names classes the markup may not use.
		.filter( ( [ , { html } ] ) => html.includes( '__header-title' ) );
	const has = ( ...marks ) =>
		entries.find( ( [ , { html } ] ) => marks.every( mark => html.includes( mark ) ) );
	// `JetpackLogo` as it last rendered, so this file needs no copy of it, best with a subtitle row.
	const [ slug ] =
		has( 'jetpack-logo', '__header-subtitle' ) ?? has( 'jetpack-logo' ) ?? entries[ 0 ] ?? [];
	return slug ? readSaved( slug, store ) : null;
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
const retitle = ( copy, { title, subtitle }, own ) => {
	copy.querySelector( 'h1' ).textContent = title;
	const row = copy.querySelector( '[class*="__header-subtitle"]' );
	// Picked as the page renders: keep the page's own row, or hold a blank line for it.
	if ( subtitle === null ) {
		if ( ! ( own && row ) ) {
			( row ?? subtitleRow( copy ) )?.replaceChildren( '\u00a0' );
		}
		return;
	}
	if ( ! subtitle ) {
		row?.remove();
		return;
	}
	// The page's own row may follow the subtitle with more, such as Forms' help link: keep it.
	if ( own && row?.textContent.startsWith( subtitle ) ) {
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
 *                               declares them: they replace those of any header shown. A null
 *                               `subtitle` keeps a line for one the page picks as it renders.
 * @return {Function} Removes the stand-in.
 */
export function showHeader( slug, el, title, declared = null ) {
	const store = readStore();
	const own = readSaved( slug, store );
	const saved = own ?? ( title ? donor( store ) : null );
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
		retitle( copy, declared ?? { title }, !! own );
	}
	const css = saved.css.replaceAll( PAGE_CLASS, bodyClassOf( slug ) ?? PAGE_CLASS );

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
