import { expect, type Page, type Locator } from '@playwright/test';

export const STATE_ON = 'output/admin-shell/state-on.json';
export const STATE_OFF = 'output/admin-shell/state-off.json';

export type ShellAppState = 'loading' | 'ready' | 'visible' | 'hidden';

export interface ShellSnapshot {
	/** Slug of the app on screen, or null while none is (switching, or the placeholder is up). */
	visible: string | null;
	apps: Record< string, ShellAppState >;
	/** False while state comes from the spike DOM fallback rather than the contract hooks. */
	hooks: boolean;
}

export interface Member {
	slug: string;
	/** wp-build mount element, used only by the spike DOM fallback. */
	mountId: string;
	/** `document.title` up to ` ‹`, as a full page load sets it. */
	title: string;
	/** Visible header text that proves the app rendered. */
	heading: string;
	/** `search + hash` a fresh load lands on with the shell off. */
	landing: RegExp;
}

/* Members registered on the test site. Titles and landings are from shell-off full loads. */
export const MEMBERS: Member[] = [
	{
		slug: 'my-jetpack',
		mountId: 'my-jetpack-dashboard-wp-admin-app',
		title: 'My Jetpack',
		heading: 'My Jetpack',
		landing: /^\?page=my-jetpack(#\/overview)?$/,
	},
	{
		slug: 'jetpack-activity-log',
		mountId: 'jetpack-activity-log-dashboard-wp-admin-app',
		title: 'Activity Log',
		heading: 'Activity Log',
		landing: /^\?page=jetpack-activity-log$/,
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
		heading: 'Jetpack AI',
		landing: /^\?page=jetpack-ai$/,
	},
	{
		slug: 'jetpack-newsletter',
		mountId: 'jetpack-newsletter-dashboard-wp-admin-app',
		title: 'Newsletter',
		heading: 'Newsletter',
		landing: /^\?page=jetpack-newsletter$/,
	},
	{
		slug: 'jetpack-podcast',
		mountId: 'jetpack-podcast-dashboard-wp-admin-app',
		title: 'Podcast',
		heading: 'Podcast',
		landing: /^\?page=jetpack-podcast$/,
	},
	{
		slug: 'jetpack-settings',
		mountId: 'jetpack-settings-dashboard-wp-admin-app',
		title: 'Settings',
		heading: 'Jetpack Performance Settings',
		landing: /^\?page=jetpack-settings(#\/performance)?$/,
	},
];

export const member = ( slug: string ): Member => {
	const found = MEMBERS.find( m => m.slug === slug );
	if ( ! found ) {
		throw new Error( `Unknown shell member ${ slug }` );
	}
	return found;
};

export const VIEW_EVENT = /(_page_view|_tab_view|_viewed)$/;

export interface Frame {
	t: number;
	href: string;
	visible: string | null;
	/** Owner of the header on screen: an app slug, `placeholder`, or null. */
	owner: string | null;
	left: number | null;
	notFound: string | null;
}

/**
 * Runs in every document before the page's own scripts. Exposes the one state reader
 * (`__jpShell.read`), and records shell events, Tracks calls and, when asked, every frame.
 *
 * @param mountIds - Member slug to wp-build mount ID, for the spike fallback.
 */
function shellProbe( mountIds: Record< string, string > ) {
	const w = window as unknown as Record< string, unknown > & {
		__jpShell: Record< string, unknown >;
	};
	const shown = ( el: Element ) => ( el as HTMLElement ).style.display !== 'none';

	const read = () => {
		const hooked = [ ...document.querySelectorAll< HTMLElement >( '[data-shell-page]' ) ];
		if ( hooked.length ) {
			const apps: Record< string, string > = {};
			hooked.forEach( el => ( apps[ el.dataset.shellPage! ] = el.dataset.shellState! ) );
			const visible = Object.keys( apps ).find( slug => apps[ slug ] === 'visible' ) ?? null;
			return { visible, apps, hooks: true };
		}
		// SPIKE_DOM_FALLBACK: remove this branch once the rewrite ships the data-shell-* hooks.
		const apps: Record< string, string > = {};
		for ( const [ slug, id ] of Object.entries( mountIds ) ) {
			const el = document.getElementById( id );
			if ( el ) {
				const rendered = !! el.querySelector( 'h1' )?.textContent?.trim();
				const onScreen = shown( el ) ? 'visible' : 'hidden';
				apps[ slug ] = rendered ? onScreen : 'loading';
			}
		}
		const placeholderUp = [
			...document.querySelectorAll( '.jetpack-admin-shell-placeholder' ),
		].some( shown );
		const visible = placeholderUp
			? null
			: ( Object.keys( apps ).find( slug => apps[ slug ] === 'visible' ) ?? null );
		return { visible, apps, hooks: false };
	};

	const events: unknown[] = [];
	for ( const type of [ 'jetpack-admin-shell:page-shown', 'jetpack-admin-shell:page-hidden' ] ) {
		window.addEventListener( type, e =>
			events.push( { type, detail: ( e as CustomEvent ).detail } )
		);
	}

	// Tracks' loader replaces `_tkq`, so wrap whatever queue is assigned.
	const tracks: string[] = [];
	const wrap = ( queue: { push: ( ...a: unknown[] ) => unknown } ) => {
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
		if ( box?.classList.contains( 'jetpack-admin-shell-placeholder' ) ) {
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
 * Install the shell probe. Call before the first navigation.
 *
 * @param page - Page under test.
 */
export async function installShellProbe( page: Page ): Promise< void > {
	await page.addInitScript(
		shellProbe,
		Object.fromEntries( MEMBERS.map( m => [ m.slug, m.mountId ] ) )
	);
}

/**
 * Read shell state through the contract hooks (or the spike fallback).
 *
 * @param page - Page under test.
 * @return Current shell state.
 */
export function readShell( page: Page ): Promise< ShellSnapshot > {
	return page.evaluate( () =>
		( window as unknown as { __jpShell: { read: () => ShellSnapshot } } ).__jpShell.read()
	);
}

/**
 * Whether the shell client is running on this document.
 *
 * @param page - Page under test.
 * @return True when the shell is active.
 */
export function isShellActive( page: Page ): Promise< boolean > {
	return page.evaluate(
		() =>
			!! document.querySelector( '[data-shell-page]' ) ||
			// SPIKE_DOM_FALLBACK: the spike exposes no hook, only its navigate() global.
			!! ( window as unknown as { jetpackAdminShell?: unknown } ).jetpackAdminShell
	);
}

/**
 * Wait until `slug` is the app on screen.
 *
 * @param page - Page under test.
 * @param slug - Member page slug.
 */
export async function waitForShown( page: Page, slug: string ): Promise< void > {
	await expect
		.poll( async () => ( await readShell( page ) ).visible, {
			message: `${ slug } becomes the visible app`,
			timeout: 45000,
		} )
		.toBe( slug );
}

/**
 * Full page load of a member, waiting until it is shown.
 *
 * @param page   - Page under test.
 * @param slug   - Member page slug.
 * @param suffix - Extra query string or hash, such as `#/help`.
 */
export async function openMember( page: Page, slug: string, suffix = '' ): Promise< void > {
	await page.goto( `/wp-admin/admin.php?page=${ slug }${ suffix }` );
	await waitForShown( page, slug );
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
 * Click a sidebar item and wait for its app.
 *
 * @param page - Page under test.
 * @param slug - Member page slug.
 */
export async function switchTo( page: Page, slug: string ): Promise< void > {
	await menuLink( page, slug ).click();
	await waitForShown( page, slug );
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
 * @param page - Page under test.
 * @param slug - Member page slug.
 */
export async function expectShown( page: Page, slug: string ): Promise< void > {
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
			.getByRole( 'heading', { name: m.heading, exact: true } )
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
	expect( facts.current, 'highlighted sidebar item' ).toEqual( [ slug ] );
	expect( facts.pageClasses, 'body page class' ).toEqual( [ `jetpack_page_${ slug }` ] );
}

/**
 * Start recording one entry per animation frame.
 *
 * @param page - Page under test.
 */
export async function startFrames( page: Page ): Promise< void > {
	await page.evaluate( () =>
		( window as unknown as { __jpShell: { record: ( on: boolean ) => void } } ).__jpShell.record(
			true
		)
	);
}

/**
 * Stop recording and return the frames.
 *
 * @param page - Page under test.
 * @return Recorded frames.
 */
export async function stopFrames( page: Page ): Promise< Frame[] > {
	return page.evaluate( () => {
		const shell = (
			window as unknown as {
				__jpShell: { frames: Frame[]; record: ( on: boolean ) => void };
			}
		 ).__jpShell;
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
	return page.evaluate( () => [
		...( window as unknown as { __jpShell: { tracks: string[] } } ).__jpShell.tracks,
	] );
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
	return page.evaluate( () => [
		...(
			window as unknown as {
				__jpShell: { events: { type: string; detail: Record< string, unknown > }[] };
			}
		 ).__jpShell.events,
	] );
}
