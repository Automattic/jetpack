import { test, expect, type Page } from '@playwright/test';
import {
	installShellProbe,
	menuLink,
	openMember,
	settle,
	startFrames,
	stopFrames,
	waitForShown,
	type Frame,
} from '../../helpers/admin-shell-helper';

/* Pairs where the spike showed a flash on JN; the rest of the matrix runs in navigation-matrix. */
const SWITCHES = [
	[ 'jetpack-forms-responses-wp-admin', 'jetpack-newsletter' ],
	[ 'jetpack-newsletter', 'my-jetpack' ],
	[ 'my-jetpack', 'jetpack-settings' ],
	[ 'my-jetpack', 'jetpack-forms-responses-wp-admin' ],
	[ 'jetpack-podcast', 'jetpack-activity-log' ],
] as const;

/* Keyed `from → to (visit)`; each reproduced on every Chromium run against the spike. */
const SPIKE_BUGS: Record< string, string > = {
	'jetpack-forms-responses-wp-admin → jetpack-newsletter (first)':
		'Spike bug: Forms’ p=/forms leaks into Newsletter’s URL, so Newsletter stays on "Route not found".',
	'jetpack-forms-responses-wp-admin → jetpack-newsletter (later)':
		'Spike bug: Forms’ p=/forms leaks into Newsletter’s URL, so Newsletter stays on "Route not found".',
	'my-jetpack → jetpack-forms-responses-wp-admin (later)':
		'Known spike bug: the outgoing app renders "Route not found" while the switch is under way.',
};

/**
 * Click `to` in the sidebar and record every frame until it has been shown for a second.
 *
 * @param page - Page under test.
 * @param to   - Member to switch to.
 * @return Frames from the click on.
 */
async function recordSwitch( page: Page, to: string ): Promise< Frame[] > {
	await startFrames( page );
	await menuLink( page, to ).click();
	await waitForShown( page, to );
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
		await menuLink( page, to ).click();
		await waitForShown( page, to );
		await menuLink( page, from ).click();
		await waitForShown( page, from );
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
				const bug = SPIKE_BUGS[ `${ from } → ${ to } (${ visit })` ];
				test.fail( !! bug, bug );
				await arrive( page, from, to, visit );
				const frames = await recordSwitch( page, to );
				expect( frames.length, 'frames were recorded' ).toBeGreaterThan( 10 );

				const notFound = frames.filter( f => f.notFound );
				expect.soft( notFound, `"not found" frames:\n${ summary( notFound ) }` ).toHaveLength( 0 );

				// Everything that stands in for the incoming page, placeholder included, sits where it ends up.
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
