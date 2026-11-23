import { test, expect, type Page } from '@playwright/test';
import { hasSavedHeader } from '../../helpers/admin-shell-a11y-helper';
import {
	installShellProbe,
	menuLink,
	openMember,
	settle,
	waitForShown,
	withinDocument,
} from '../../helpers/admin-shell-helper';

/* JETPACK-3728: on a first visit, every member's stand-in header shows its real title and subtitle. */
const HOST = 'my-jetpack';
// Holds the guest's assets back, so its stand-in is on screen for a while.
const GUEST_DELAY_MS = 1500;

interface Declared {
	header?: { title: string; subtitle: string | null } | false | null;
}

interface HeaderFrame {
	owner: 'stand-in' | 'app';
	title: string;
	titleTop: number;
	subtitle: string | null;
	subtitleTop: number | null;
}

const membersOf = ( page: Page ) =>
	page.evaluate( () => {
		const data = document.getElementById( 'wp-script-module-data-@automattic/jetpack-admin-shell' );
		return JSON.parse( data?.textContent ?? '{}' ).members as Record< string, Declared >;
	} );

// Per animation frame, the title and subtitle of `slug`'s stand-in or, once that is gone, its app.
const record = ( page: Page, slug: string ) =>
	page.evaluate( s => {
		const frames: unknown[] = [];
		( window as unknown as { __headerFrames: unknown[] } ).__headerFrames = frames;
		const read = ( root: Element | null, owner: string ) => {
			const title = root?.querySelector( '[class*="__header-title"]' );
			if ( ! title || ! title.checkVisibility( { visibilityProperty: true } ) ) {
				return null;
			}
			const row = root!.querySelector( '[class*="__header-subtitle"]' );
			return {
				owner,
				title: title.textContent,
				titleTop: Math.round( title.getBoundingClientRect().top ),
				subtitle: row?.textContent ?? null,
				subtitleTop: row ? Math.round( row.getBoundingClientRect().top ) : null,
			};
		};
		const sample = () => {
			const frame =
				read( document.querySelector( `[data-shell-header="${ s }"]` ), 'stand-in' ) ??
				read( document.querySelector( `[data-shell-page="${ s }"]` ), 'app' );
			if ( frame ) {
				frames.push( frame );
			}
			requestAnimationFrame( sample );
		};
		requestAnimationFrame( sample );
	}, slug );

const recorded = ( page: Page ) =>
	page.evaluate( () => ( window as unknown as { __headerFrames: HeaderFrame[] } ).__headerFrames );

/**
 * Check `slug`'s frames: the stand-in held the title and subtitle its app rendered, as declared.
 *
 * @param slug   - Member page slug.
 * @param header - Its declared header.
 * @param frames - Frames from the click on.
 */
function expectHeldHeader( slug: string, header: Declared[ 'header' ], frames: HeaderFrame[] ) {
	const standIn = frames.filter( f => f.owner === 'stand-in' );
	const trace = frames.map( f => JSON.stringify( f ) ).join( '\n' );
	if ( header === false ) {
		expect.soft( standIn, `${ slug } opts out, so shows no stand-in:\n${ trace }` ).toEqual( [] );
		return;
	}
	const app = frames.filter( f => f.owner === 'app' ).at( -1 );
	expect.soft( header ?? null, `${ slug } declares its header, or opts out` ).not.toBeNull();
	expect.soft( standIn.length, `${ slug } showed a stand-in:\n${ trace }` ).toBeGreaterThan( 0 );
	expect.soft( app, `${ slug } rendered its header` ).toBeTruthy();
	if ( ! header || ! app ) {
		return;
	}

	// The declared header is the dashboard's own, so the two can't drift apart unnoticed.
	expect.soft( app.title, `${ slug }'s declared title` ).toBe( header.title );
	if ( header.subtitle === '' ) {
		expect.soft( app.subtitle, `${ slug } has no subtitle` ).toBeNull();
	} else if ( header.subtitle !== null ) {
		expect.soft( app.subtitle ?? '', `${ slug }'s declared subtitle` ).toContain( header.subtitle );
	}

	for ( const frame of standIn ) {
		const at = `${ slug }, stand-in frame ${ JSON.stringify( frame ) }`;
		expect
			.soft( [ frame.title, frame.titleTop ], `${ at }: title` )
			.toEqual( [ app.title, app.titleTop ] );
		expect.soft( frame.subtitleTop, `${ at }: subtitle position` ).toBe( app.subtitleTop );
		if ( header.subtitle ) {
			expect
				.soft( app.subtitle ?? '', `${ at }: subtitle text` )
				.toContain( frame.subtitle ?? '-' );
		}
	}
}

/**
 * From a first visit to the host, with nothing saved but its own header, click `slug` and record it.
 *
 * @param page - Page under test.
 * @param slug - Member page slug.
 * @return Frames from the click on.
 */
async function firstVisit( page: Page, slug: string ): Promise< HeaderFrame[] > {
	await openMember( page, HOST );
	await page.evaluate( () =>
		Object.keys( localStorage )
			.filter( key => key.startsWith( 'jetpack-admin-shell-header:' ) )
			.forEach( key => localStorage.removeItem( key ) )
	);
	await page.reload();
	await waitForShown( page, HOST );
	await expect.poll( () => hasSavedHeader( page, HOST ) ).toBe( true );

	await record( page, slug );
	await withinDocument( page, `switching to ${ slug }`, async () => {
		await menuLink( page, slug ).click();
		await waitForShown( page, slug );
	} );
	await settle( page, 500 );
	return recorded( page );
}

// The members other than the host that the sidebar links to.
const inMenu = async ( page: Page, slugs: string[] ) => {
	const linked = await Promise.all( slugs.map( slug => menuLink( page, slug ).count() ) );
	return slugs.filter( ( slug, i ) => slug !== HOST && linked[ i ] > 0 );
};

test.describe( 'Admin shell: stand-in header', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
		await page.route( /admin-ajax\.php\?.*action=jetpack_admin_shell_guest/, async route => {
			await new Promise( resolve => setTimeout( resolve, GUEST_DELAY_MS ) );
			await route.continue();
		} );
	} );

	test( 'on a first visit, each page’s title and subtitle are right from the stand-in on', async ( {
		page,
	} ) => {
		test.setTimeout( 600000 );
		await openMember( page, HOST );
		const members = await membersOf( page );
		const guests = await inMenu( page, Object.keys( members ) );
		expect( guests.length, 'other members in the menu' ).toBeGreaterThan( 0 );
		test.info().annotations.push( { type: 'members', description: guests.join( ', ' ) } );

		for ( const slug of guests ) {
			await test.step( slug, async () => {
				expectHeldHeader( slug, members[ slug ].header, await firstVisit( page, slug ) );
			} );
		}
	} );
} );
