import { test, expect } from '@playwright/test';
import {
	installShellProbe,
	openMember,
	shellEvents,
	switchTo,
} from '../../helpers/admin-shell-helper';

const FORMS = 'jetpack-forms-responses-wp-admin';

test.describe( 'Admin shell: stale hidden dashboards', () => {
	test.beforeEach( async ( { page } ) => {
		// Lets a test move the shell's clock on without touching the apps' timers.
		await page.addInitScript( () => {
			const now = Date.now;
			Date.now = () => now() + ( ( window as unknown as { __skew?: number } ).__skew ?? 0 );
		} );
		await installShellProbe( page );
	} );

	for ( const [ minutes, stale ] of [
		[ 4, false ],
		[ 5, true ],
	] as const ) {
		test( `a dashboard shown again after ${ minutes } minutes hidden is ${
			stale ? 'stale' : 'fresh'
		}`, async ( { page } ) => {
			await openMember( page, 'my-jetpack' );
			await switchTo( page, FORMS );
			await page.evaluate(
				skew => ( ( window as unknown as { __skew: number } ).__skew = skew ),
				minutes * 60000
			);
			await switchTo( page, 'my-jetpack' );

			const shown = ( await shellEvents( page ) ).filter(
				e => e.type === 'jetpack-admin-shell:page-shown' && e.detail.page === 'my-jetpack'
			);
			expect( shown.at( -1 )?.detail ).toMatchObject( { firstShow: false, stale } );
		} );
	}
} );
