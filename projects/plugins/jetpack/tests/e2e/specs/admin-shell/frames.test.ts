import { test, expect, type Page } from '@playwright/test';
import {
	installShellProbe,
	menuLink,
	openMember,
	settle,
	startFrames,
	stopFrames,
	switchTo,
	waitForShown,
	withinDocument,
	type Frame,
} from '../../helpers/admin-shell-helper';

const FORMS = 'jetpack-forms-responses-wp-admin';

const SWITCHES = [
	[ 'my-jetpack', FORMS ],
	[ FORMS, 'my-jetpack' ],
] as const;

/**
 * Click `to` in the sidebar and record every frame until it has been shown for a second.
 *
 * @param page - Page under test.
 * @param to   - Member to switch to.
 * @return Frames from the click on.
 */
async function recordSwitch( page: Page, to: string ): Promise< Frame[] > {
	await startFrames( page );
	await withinDocument( page, `switching to ${ to }`, async () => {
		await menuLink( page, to ).click();
		await waitForShown( page, to );
	} );
	await settle( page, 1000 );
	return stopFrames( page );
}

/**
 * Open `from`, and for a later visit, go to `to` and back first.
 *
 * @param page  - Page under test.
 * @param from  - Member to start on.
 * @param to    - Member the test switches to.
 * @param visit - `first` or `later`.
 */
async function arrive( page: Page, from: string, to: string, visit: string ) {
	await openMember( page, from );
	if ( visit === 'later' ) {
		await switchTo( page, to );
		await switchTo( page, from );
	}
}

const summary = ( frames: Frame[] ) =>
	frames
		.map( f => `${ f.t } ${ f.owner ?? '-' } left=${ f.left } ${ f.notFound ?? '' }` )
		.join( '\n' );

test.describe( 'Admin shell: frame by frame', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	for ( const [ from, to ] of SWITCHES ) {
		for ( const visit of [ 'first', 'later' ] ) {
			test( `${ from } → ${ to } (${ visit } visit): no not-found frame, stable content offset`, async ( {
				page,
			} ) => {
				await arrive( page, from, to, visit );
				const frames = await recordSwitch( page, to );
				// WebKit only runs animation frames while something paints, so count frames that show the switch.
				expect(
					frames.some( f => f.owner === to ),
					`frames were recorded through the switch:
${ summary( frames ) }`
				).toBe( true );

				const notFound = frames.filter( f => f.notFound );
				expect.soft( notFound, `"not found" frames:\n${ summary( notFound ) }` ).toHaveLength( 0 );

				// Everything that stands in for the incoming page, the stand-in header included, sits where it ends up.
				const incoming = frames.filter(
					f => f.left !== null && ( f.owner === to || f.owner === 'placeholder' )
				);
				const offsets = [ ...new Set( incoming.map( f => f.left ) ) ];
				expect
					.soft( offsets, `content offsets during the switch:\n${ summary( incoming ) }` )
					.toHaveLength( 1 );
			} );
		}
	}
} );
