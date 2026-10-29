import { test, expect } from '@playwright/test';
import {
	installShellProbe,
	openMember,
	readShell,
	shellEvents,
	switchTo,
} from '../../helpers/admin-shell-helper';

/* The JETPACK-3398 contracts the rewrite adds. Once these pass, drop SPIKE_DOM_FALLBACK. */
test.describe( 'Admin shell: contract hooks and events', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	test( 'each app container carries data-shell-page and data-shell-state', async ( { page } ) => {
		test.fail( true, 'Known spike gap: no data-shell-* hooks yet (contract item 4).' );
		await openMember( page, 'my-jetpack' );
		await switchTo( page, 'jetpack-newsletter' );
		const state = await readShell( page );
		expect( state.hooks ).toBe( true );
		expect( state.apps ).toEqual( { 'my-jetpack': 'hidden', 'jetpack-newsletter': 'visible' } );
	} );

	test( 'page-shown fires on a full load and on every switch, page-hidden on leaving', async ( {
		page,
	} ) => {
		test.fail(
			true,
			'Known spike gap: no jetpack-admin-shell:page-* events yet (contract item 3).'
		);
		await openMember( page, 'my-jetpack' );
		await switchTo( page, 'jetpack-newsletter' );
		await switchTo( page, 'my-jetpack' );
		const events = await shellEvents( page );
		const shown = events
			.filter( e => e.type === 'jetpack-admin-shell:page-shown' )
			.map( e => [ e.detail.page, e.detail.previous ?? null, e.detail.firstShow ] );
		expect( shown ).toEqual( [
			[ 'my-jetpack', null, true ],
			[ 'jetpack-newsletter', 'my-jetpack', true ],
			[ 'my-jetpack', 'jetpack-newsletter', false ],
		] );
		const hidden = events
			.filter( e => e.type === 'jetpack-admin-shell:page-hidden' )
			.map( e => e.detail.page );
		expect( hidden ).toEqual( [ 'my-jetpack', 'jetpack-newsletter' ] );
	} );
} );
