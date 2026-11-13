import { test, expect, type Page, type Locator, type Request } from '@playwright/test';

export const STATE_ON = 'output/admin-shell/state-on.json';
export const STATE_OFF = 'output/admin-shell/state-off.json';
export const STATE_STANDALONE = 'output/admin-shell/state-standalone.json';

export type ShellAppState = 'loading' | 'ready' | 'visible' | 'hidden';

export interface ShellSnapshot {
	/** Slug of the app on screen, or null while none is (switching, or a stand-in header is up). */
	visible: string | null;
	apps: Record< string, ShellAppState >;
	/** `hooks`: the contract. `page`: a document without the shell. */
	source: 'hooks' | 'page';
}

export interface Member {
	slug: string;
	/** wp-build mount element, read when the document has no `data-shell-*` hooks. */
	mountId: string;
	/** `document.title` up to ` ‹`, as a full page load sets it. */
	title: string;
	/** Visible header text that proves the app rendered: exact as a string, a match as a RegExp. */
	heading: string | RegExp;
	/** `search + hash` a fresh load lands on with the shell off. */
	landing: RegExp;
	/** Needs site setup; tests that use it skip on a site whose admin menu lacks it. */
	optional?: true;
}

/* Members registered on the test site. Titles and landings are from shell-off full loads. */
export const MEMBERS: Member[] = [
	{
		slug: 'my-jetpack',
		mountId: 'my-jetpack-dashboard-wp-admin-app',
		title: 'My Jetpack',
		heading: 'Jetpack',
		landing: /^\?page=my-jetpack(&p=%2Foverview)?$/,
	},
	{
		slug: 'jetpack-forms-responses-wp-admin',
		mountId: 'jetpack-forms-responses-wp-admin-app',
		title: 'Jetpack Forms',
		heading: 'Forms',
		landing: /^\?page=jetpack-forms-responses-wp-admin&p=%2Fforms$/,
	},
	{
		slug: 'jetpack-ai',
		mountId: 'jetpack-ai-hub-wp-admin-app',
		title: 'Jetpack AI',
		heading: /Jetpack AI/,
		landing: /^\?page=jetpack-ai(&p=%2F[^#&]*)?$/,
	},
	{
		slug: 'jetpack-settings',
		mountId: 'jetpack-settings-dashboard-wp-admin-app',
		title: 'Settings',
		heading: /Settings/,
		// Settings routes with a HashRouter.
		landing: /^\?page=jetpack-settings(#\/[\w-]*)?$/,
	},
	{
		slug: 'jetpack-podcast',
		mountId: 'jetpack-podcast-dashboard-wp-admin-app',
		title: 'Podcast',
		heading: /Podcast/,
		landing: /^\?page=jetpack-podcast(&p=%2F[^#&]*)?$/,
	},
	{
		slug: 'jetpack-seo',
		mountId: 'jetpack-seo-dashboard-wp-admin-app',
		title: 'SEO',
		heading: 'SEO',
		landing: /^\?page=jetpack-seo$/,
		// Needs the `seo-admin-ui` plan feature or the `rsm_jetpack_seo` filter, and the seo-tools module on.
		optional: true,
	},
	/* Activity Log, Newsletter, Protect and VideoPress are members too, but each needs a WordPress.com
	 * connection (their modules don't load in offline mode), and the test site has none. */
];

export const member = ( slug: string ): Member => {
	const found = MEMBERS.find( m => m.slug === slug );
	if ( ! found ) {
		throw new Error( `Unknown shell member ${ slug }` );
	}
	return found;
};

const menuSlugs = new Map< string, Promise< Set< string > > >();

/**
 * The page slugs the Jetpack submenu links to, read in a page of its own so the test's page stays put.
 *
 * @param page - Page under test, for its session.
 * @return Submenu page slugs.
 */
async function readMenuSlugs( page: Page ): Promise< Set< string > > {
	const probe = await page.context().newPage();
	try {
		await probe.goto( '/wp-admin/admin.php?page=my-jetpack&jetpack_admin_shell=0' );
		const hrefs = await probe
			.locator( '#adminmenu .wp-submenu a' )
			.evaluateAll( links => links.map( a => a.getAttribute( 'href' ) ?? '' ) );
		return new Set( hrefs.map( href => /[?&]page=([^&]+)/.exec( href )?.[ 1 ] ?? '' ) );
	} finally {
		await probe.close();
	}
}

/**
 * Whether a member's page is on this site, read once per site from the admin menu.
 *
 * @param page - Page under test.
 * @param slug - Member slug.
 * @return False only for an optional member the site doesn't show.
 */
export async function onSite( page: Page, slug: string ): Promise< boolean > {
	if ( ! member( slug ).optional ) {
		return true;
	}
	const base = String( test.info().project.use.baseURL ?? '' );
	if ( ! menuSlugs.has( base ) ) {
		menuSlugs.set(
			base,
			readMenuSlugs( page ).catch( error => {
				// Forget a failed probe, so the next test reads the menu again.
				menuSlugs.delete( base );
				throw error;
			} )
		);
	}
	return ( await menuSlugs.get( base )! ).has( slug );
}

/**
 * Skip the test when any of the members isn't on this site.
 *
 * @param page  - Page under test.
 * @param slugs - Member slugs the test uses.
 */
export async function skipUnlessOnSite( page: Page, ...slugs: string[] ): Promise< void > {
	for ( const slug of slugs ) {
		test.skip( ! ( await onSite( page, slug ) ), `${ slug } is not on this site` );
	}
}

/** What the probe exposes on `window.__jpShell`. */
interface ShellProbe {
	read: () => ShellSnapshot;
	events: { type: string; detail: Record< string, unknown > }[];
	tracks: string[];
	frames: Frame[];
	record: ( on: boolean ) => void;
}
type ProbeWindow = { __jpShell: ShellProbe };

export const VIEW_EVENT = /(_page_view|_tab_view|_viewed)$/;

export interface Frame {
	t: number;
	href: string;
	visible: string | null;
	/** Owner of the header on screen: an app slug, `placeholder` (the shell's stand-in), or null. */
	owner: string | null;
	left: number | null;
	notFound: string | null;
}

/**
 * Runs in every document before the page's own scripts. Exposes the one state reader
 * (`__jpShell.read`), and records shell events, Tracks calls and, when asked, every frame.
 *
 * @param mountIds - Member slug to wp-build mount ID, for documents without the hooks.
 */
function shellProbe( mountIds: Record< string, string > ) {
	const w = window as unknown as Record< string, unknown > & {
		__jpShell: Record< string, unknown >;
	};
	const shown = ( el: Element ) => ( el as HTMLElement ).style.display !== 'none';

	const mountState = ( slug: string ) => {
		const el = document.getElementById( mountIds[ slug ] );
		if ( ! el ) {
			return null;
		}
		const rendered = !! el.querySelector( 'h1' )?.textContent?.trim();
		const onScreen = shown( el ) ? 'visible' : 'hidden';
		return rendered ? onScreen : 'loading';
	};

	const read = () => {
		const hooked = [ ...document.querySelectorAll< HTMLElement >( '[data-shell-page]' ) ];
		if ( hooked.length ) {
			const apps: Record< string, string > = {};
			hooked.forEach( el => ( apps[ el.dataset.shellPage! ] = el.dataset.shellState! ) );
			const visible = Object.keys( apps ).find( slug => apps[ slug ] === 'visible' ) ?? null;
			return { visible, apps, source: 'hooks' };
		}

		/* No shell (shell off, or ?jetpack_admin_shell=0): the body class names the page and its
		 * mount is the app. A poll can land before <body> exists. */
		const slug = /(?:^|\s)jetpack_page_(\S+)/.exec( document.body?.className ?? '' )?.[ 1 ];
		const state = slug && slug in mountIds ? mountState( slug ) : null;
		const apps: Record< string, string > = state ? { [ slug! ]: state } : {};
		return { visible: state === 'visible' ? slug! : null, apps, source: 'page' };
	};

	const events: unknown[] = [];
	for ( const type of [ 'jetpack-admin-shell:page-shown', 'jetpack-admin-shell:page-hidden' ] ) {
		window.addEventListener( type, e =>
			events.push( { type, detail: ( e as CustomEvent ).detail } )
		);
	}

	// Tracks' loader replaces `_tkq`, so wrap whatever queue is assigned.
	const tracks: string[] = [];
	const wrapped = new WeakSet< object >();
	const wrap = ( queue: { push: ( ...a: unknown[] ) => unknown } ) => {
		// `_tkq = _tkq || []` reassigns the same queue; wrapping it twice would record each event twice.
		if ( ! queue || wrapped.has( queue ) ) {
			return queue;
		}
		wrapped.add( queue );
		const push = queue.push.bind( queue );
		queue.push = ( ...items: unknown[] ) => {
			for ( const item of items ) {
				if ( Array.isArray( item ) && item[ 0 ] === 'recordEvent' ) {
					tracks.push( String( item[ 1 ] ) );
				}
			}
			return push( ...items );
		};
		return queue;
	};
	let tkq = wrap( [] as unknown[] as { push: ( ...a: unknown[] ) => unknown } );
	Object.defineProperty( window, '_tkq', {
		configurable: true,
		get: () => tkq,
		set: value => ( tkq = wrap( value ) ),
	} );

	const frames: unknown[] = [];
	let recording = false;
	const sample = () => {
		if ( ! recording ) {
			return;
		}
		const state = read();
		const containers = [
			...document.querySelectorAll( '[data-shell-page], #wpbody-content .boot-layout-container' ),
		].filter( shown );
		const text = containers.map( el => el.textContent ?? '' ).join( ' ' );
		const header = containers.map( el => el.querySelector( 'h1' ) ).find( Boolean );
		const box = header?.closest( '.boot-layout-container, [data-shell-page]' );
		let owner: string | null = null;
		if ( box?.hasAttribute( 'data-shell-header' ) ) {
			owner = 'placeholder';
		} else if ( box ) {
			owner =
				( box as HTMLElement ).dataset.shellPage ??
				Object.keys( mountIds ).find( slug => mountIds[ slug ] === box.id ) ??
				null;
		}
		frames.push( {
			t: Math.round( performance.now() ),
			href: location.search + location.hash,
			visible: state.visible,
			owner,
			left: header ? Math.round( header.getBoundingClientRect().left ) : null,
			notFound: /no route found|route not found/i.exec( text )?.[ 0 ] ?? null,
		} );
		requestAnimationFrame( sample );
	};

	w.__jpShell = {
		read,
		events,
		tracks,
		frames,
		record: ( on: boolean ) => {
			recording = on;
			frames.length = 0;
			if ( on ) {
				requestAnimationFrame( sample );
			}
		},
	};
}

/**
 * Log in through the wp-login.php of `page`'s base URL.
 *
 * @param page     - Page to log in with.
 * @param user     - Username.
 * @param password - Password.
 */
export async function submitLogin( page: Page, user: string, password: string ): Promise< void > {
	await page.goto( '/wp-login.php' );
	// Jetpack SSO can put the WordPress.com button first.
	const toggle = page.getByText( 'Log in with username and password' );
	if ( await toggle.isVisible().catch( () => false ) ) {
		await toggle.click();
	}
	/* wp-login.php focuses a field 200 ms after load, and empties the password first when the username
	 * comes prefilled, as it does for a context that is already logged in. Fill only after that runs. */
	await page
		.waitForFunction(
			() => !! document.querySelector( '#user_login:focus, #user_pass:focus' ),
			null,
			{ timeout: 5000 }
		)
		.catch( () => undefined );
	await expect( async () => {
		await page.locator( '#user_login' ).fill( user );
		await page.locator( '#user_pass' ).fill( password );
		await expect( page.locator( '#user_login' ) ).toHaveValue( user, { timeout: 1000 } );
		await expect( page.locator( '#user_pass' ) ).toHaveValue( password, { timeout: 1000 } );
	} ).toPass( { timeout: 15000 } );
	await page.locator( '#wp-submit' ).click();
	await expect( page.locator( '#wpadminbar' ) ).toBeVisible( { timeout: 60000 } );
}

const pageErrors = new WeakMap< Page, string[] >();

/**
 * Install the shell probe. Call before the first navigation.
 *
 * @param page - Page under test.
 */
export async function installShellProbe( page: Page ): Promise< void > {
	const errors: string[] = [];
	pageErrors.set( page, errors );
	page.on( 'pageerror', error => errors.push( error.message ) );
	page.on( 'console', message => {
		if ( message.type() === 'error' ) {
			errors.push( message.text() );
		}
	} );
	await page.addInitScript(
		shellProbe,
		Object.fromEntries( MEMBERS.map( m => [ m.slug, m.mountId ] ) )
	);
	// Admin bar hover menus can open over the Jetpack submenu and swallow sidebar clicks; they aren't under test.
	await page.addInitScript( () => {
		document.addEventListener( 'DOMContentLoaded', () => {
			const style = document.createElement( 'style' );
			style.textContent = '#wpadminbar .ab-sub-wrapper { display: none !important; }';
			document.head.append( style );
		} );
	} );
}

/**
 * Read shell state through the contract hooks, or the page DOM where there are none.
 *
 * @param page - Page under test.
 * @return Current shell state.
 */
export function readShell( page: Page ): Promise< ShellSnapshot > {
	return page.evaluate( () => ( window as unknown as ProbeWindow ).__jpShell.read() );
}

/**
 * Whether the shell client is running on this document.
 *
 * @param page - Page under test.
 * @return True when the shell is active.
 */
export async function isShellActive( page: Page ): Promise< boolean > {
	return ( await readShell( page ) ).source !== 'page';
}

/**
 * Wait until `slug` is the app on screen.
 *
 * @param page - Page under test.
 * @param slug - Member page slug.
 */
export async function waitForShown( page: Page, slug: string ): Promise< void > {
	await expect
		// A fallback page load destroys the document mid-poll; read again on the next one.
		.poll( async () => ( await readShell( page ).catch( () => null ) )?.visible ?? null, {
			message: `${ slug } becomes the visible app`,
			timeout: 45000,
		} )
		.toBe( slug );
}

/**
 * Full page load of a member on the shell-on site, waiting until it is shown.
 *
 * @param page   - Page under test.
 * @param slug   - Member page slug.
 * @param suffix - Extra query string or hash, such as `#/help`.
 */
export async function openMember( page: Page, slug: string, suffix = '' ): Promise< void > {
	await page.goto( `/wp-admin/admin.php?page=${ slug }${ suffix }` );
	await waitForShown( page, slug );
	const active = await expect
		.poll( () => isShellActive( page ) )
		.toBe( true )
		.then(
			() => true,
			() => false
		);
	if ( ! active ) {
		// Say why, since every shell-on test fails here alike.
		const assets = await page.evaluate( () => ( {
			config: !! document.getElementById( 'wp-script-module-data-@automattic/jetpack-admin-shell' ),
			client:
				document.querySelector< HTMLScriptElement >( 'script[type="module"][src*="admin-shell"]' )
					?.src ?? null,
		} ) );
		throw new Error(
			`The shell doesn't run on ${ slug }: ${ JSON.stringify( {
				...assets,
				errors: pageErrors.get( page ) ?? [],
			} ) }`
		);
	}
}

/**
 * Mark the current document, so `sameDocument()` can tell a later full load apart.
 *
 * @param page - Page under test.
 */
export async function markDocument( page: Page ): Promise< void > {
	await page.evaluate(
		() => ( ( window as unknown as { __sameDocument: boolean } ).__sameDocument = true )
	);
}

/**
 * Whether the document marked by `markDocument()` is still the one loaded.
 *
 * @param page - Page under test.
 * @return False after a full page load.
 */
export function sameDocument( page: Page ): Promise< boolean > {
	return page.evaluate(
		() => !! ( window as unknown as { __sameDocument?: boolean } ).__sameDocument
	);
}

/**
 * The sidebar link for a page.
 *
 * @param page - Page under test.
 * @param slug - Admin page slug.
 * @return Link locator.
 */
export function menuLink( page: Page, slug: string ): Locator {
	return page.locator( `#adminmenu .wp-submenu a[href$="page=${ slug }"]` ).first();
}

/**
 * Run `action` and assert it neither replaced the document nor started a main-frame load.
 *
 * @param page   - Page under test.
 * @param label  - What the action does, for the assertion messages.
 * @param action - Navigation to run, including its wait for the result.
 */
export async function withinDocument(
	page: Page,
	label: string,
	action: () => Promise< void >
): Promise< void > {
	// A load still pending when the app shows in place leaves the old document's marker readable.
	const loads: string[] = [];
	const onRequest = ( request: Request ) => {
		if ( request.isNavigationRequest() && request.frame() === page.mainFrame() ) {
			loads.push( request.url() );
		}
	};
	await markDocument( page );
	page.on( 'request', onRequest );
	try {
		await action();
		// Catch a reload or location.assign() the app fires just after it shows.
		await settle( page, 500 );
	} finally {
		page.off( 'request', onRequest );
	}
	expect( loads, `${ label } loaded no new page` ).toEqual( [] );
	expect( await sameDocument( page ), `${ label } stayed in the same document` ).toBe( true );
}

/**
 * Click a sidebar item and wait for its app, which must arrive without a full page load.
 *
 * @param page - Page under test.
 * @param slug - Member page slug.
 */
export async function switchTo( page: Page, slug: string ): Promise< void > {
	await withinDocument( page, `switching to ${ slug }`, async () => {
		await menuLink( page, slug ).click();
		await waitForShown( page, slug );
	} );
}

/**
 * Define tests that hit an intermittent spike bug: annotated, and retried so they report as flaky.
 *
 * @param reason - The bug, or nothing to define the tests plainly.
 * @param define - Declares the tests.
 */
export function intermittentSpikeBug(
	reason: string | null | undefined,
	define: () => void
): void {
	if ( ! reason ) {
		define();
		return;
	}

	test.describe(
		'intermittent spike bug',
		{ annotation: { type: 'intermittent spike bug', description: reason } },
		() => {
			test.describe.configure( { retries: 2 } );
			define();
		}
	);
}

/**
 * Wait a fixed time, for checks that something does not happen (a stray write, a missing event).
 *
 * @param page - Page under test.
 * @param ms   - Milliseconds.
 */
export async function settle( page: Page, ms: number ): Promise< void > {
	// eslint-disable-next-line playwright/no-wait-for-timeout -- Nothing to wait on when asserting an absence.
	await page.waitForTimeout( ms );
}

/**
 * Wait until the page has gone `quietMs` with no DOM change and no request in flight, or `maxMs` passes.
 *
 * @param page    - Page under test.
 * @param maxMs   - Longest wait, as a fixed settle would use.
 * @param quietMs - Quiet time that counts as settled.
 */
export async function waitForQuiet( page: Page, maxMs: number, quietMs = 1000 ): Promise< void > {
	const inFlight = new Set< Request >();
	let lastNetwork = Date.now();
	const started = ( request: Request ) => {
		inFlight.add( request );
		lastNetwork = Date.now();
	};
	const ended = ( request: Request ) => {
		inFlight.delete( request );
		lastNetwork = Date.now();
	};
	page.on( 'request', started );
	page.on( 'requestfinished', ended );
	page.on( 'requestfailed', ended );
	try {
		await page.evaluate( () => {
			const w = window as unknown as { __jpLastMutation?: number };
			w.__jpLastMutation = Date.now();
			new MutationObserver( () => ( w.__jpLastMutation = Date.now() ) ).observe( document, {
				subtree: true,
				childList: true,
				attributes: true,
				characterData: true,
			} );
		} );
		const deadline = Date.now() + maxMs;
		while ( Date.now() < deadline ) {
			const lastMutation = await page.evaluate(
				() => ( window as unknown as { __jpLastMutation: number } ).__jpLastMutation
			);
			const now = Date.now();
			if ( ! inFlight.size && now - lastNetwork >= quietMs && now - lastMutation >= quietMs ) {
				return;
			}
			await settle( page, 250 );
		}
	} finally {
		page.off( 'request', started );
		page.off( 'requestfinished', ended );
		page.off( 'requestfailed', ended );
	}
}

/**
 * `search + hash` of the current URL.
 *
 * @param page - Page under test.
 * @return Current location suffix.
 */
export function where( page: Page ): Promise< string > {
	return page.evaluate( () => location.search + location.hash );
}

/**
 * Assert everything a user sees for the shown member: app, URL page, title, sidebar and body class.
 *
 * @param page            - Page under test.
 * @param slug            - Member page slug.
 * @param options         - Checks to leave out.
 * @param options.sidebar - False to skip the sidebar highlight, when a test covers it separately.
 */
export async function expectShown(
	page: Page,
	slug: string,
	{ sidebar = true }: { sidebar?: boolean } = {}
): Promise< void > {
	const m = member( slug );
	const state = await readShell( page );
	expect( state.visible, 'visible app' ).toBe( slug );
	for ( const [ other, appState ] of Object.entries( state.apps ) ) {
		if ( other !== slug ) {
			expect( appState, `${ other } is not visible` ).not.toBe( 'visible' );
		}
	}
	expect( new URL( page.url() ).searchParams.get( 'page' ) ).toBe( slug );
	await expect(
		page
			.getByRole( 'heading', { name: m.heading, exact: typeof m.heading === 'string' } )
			.filter( { visible: true } )
			.first()
	).toBeVisible();
	const facts = await page.evaluate( () => ( {
		title: document.title.split( ' ‹' )[ 0 ].trim(),
		current: [ ...document.querySelectorAll( '#adminmenu .wp-submenu li.current > a' ) ].map( a =>
			new URL( ( a as HTMLAnchorElement ).href ).searchParams.get( 'page' )
		),
		pageClasses: document.body.className
			.split( /\s+/ )
			.filter( c => c.startsWith( 'jetpack_page_' ) ),
	} ) );
	expect( facts.title, 'document.title' ).toBe( m.title );
	if ( sidebar ) {
		expect( facts.current, 'highlighted sidebar item' ).toEqual( [ slug ] );
	}
	expect( facts.pageClasses, 'body page class' ).toEqual( [ `jetpack_page_${ slug }` ] );
}

/**
 * Start recording one entry per animation frame.
 *
 * @param page - Page under test.
 */
export async function startFrames( page: Page ): Promise< void > {
	await page.evaluate( () => ( window as unknown as ProbeWindow ).__jpShell.record( true ) );
}

/**
 * Stop recording and return the frames.
 *
 * @param page - Page under test.
 * @return Recorded frames.
 */
export async function stopFrames( page: Page ): Promise< Frame[] > {
	return page.evaluate( () => {
		const shell = ( window as unknown as ProbeWindow ).__jpShell;
		const frames = [ ...shell.frames ];
		shell.record( false );
		return frames;
	} );
}

/**
 * Tracks event names recorded on this document so far.
 *
 * @param page - Page under test.
 * @return Event names in order.
 */
export function tracksEvents( page: Page ): Promise< string[] > {
	return page.evaluate( () => [ ...( window as unknown as ProbeWindow ).__jpShell.tracks ] );
}

/**
 * Shell contract events recorded on this document so far.
 *
 * @param page - Page under test.
 * @return Events with their payloads.
 */
export function shellEvents(
	page: Page
): Promise< { type: string; detail: Record< string, unknown > }[] > {
	return page.evaluate( () => [ ...( window as unknown as ProbeWindow ).__jpShell.events ] );
}
