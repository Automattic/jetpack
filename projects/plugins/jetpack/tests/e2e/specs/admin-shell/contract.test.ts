import { test, expect } from '@playwright/test';
import {
	installShellProbe,
	openMember,
	readShell,
	shellEvents,
	switchTo,
} from '../../helpers/admin-shell-helper';

const FORMS = 'jetpack-forms-responses-wp-admin';

/* JETPACK-3398 contracts 3 and 4. */
test.describe( 'Admin shell: contract hooks and events', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	test( 'each app container carries data-shell-page and data-shell-state', async ( { page } ) => {
		await openMember( page, 'my-jetpack' );
		await switchTo( page, FORMS );
		const state = await readShell( page );
		expect( state.source ).toBe( 'hooks' );
		expect( state.apps ).toEqual( { 'my-jetpack': 'hidden', [ FORMS ]: 'visible' } );
	} );

	test( 'page-shown fires on a full load and on every switch, page-hidden on leaving', async ( {
		page,
	} ) => {
		await openMember( page, 'my-jetpack' );
		await switchTo( page, FORMS );
		await switchTo( page, 'my-jetpack' );
		const events = await shellEvents( page );
		const shown = events
			.filter( e => e.type === 'jetpack-admin-shell:page-shown' )
			.map( e => [ e.detail.page, e.detail.previous ?? null, e.detail.firstShow ] );
		expect( shown ).toEqual( [
			[ 'my-jetpack', null, true ],
			[ FORMS, 'my-jetpack', true ],
			[ 'my-jetpack', FORMS, false ],
		] );
		const hidden = events
			.filter( e => e.type === 'jetpack-admin-shell:page-hidden' )
			.map( e => e.detail.page );
		expect( hidden ).toEqual( [ 'my-jetpack', FORMS ] );
	} );
} );
