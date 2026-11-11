import { test, expect } from '@playwright/test';
import {
	MEMBERS,
	expectShown,
	installShellProbe,
	menuLink,
	openMember,
	switchTo,
	where,
} from '../../helpers/admin-shell-helper';

/* Every ordered pair, so each member is tested as the host and as a guest. */
const pairs = MEMBERS.flatMap( a => MEMBERS.filter( b => b !== a ).map( b => [ a, b ] as const ) );

test.describe( 'Admin shell: navigation matrix', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	for ( const [ a, b ] of pairs ) {
		test( `${ a.slug } → ${ b.slug } → ${ a.slug }`, async ( { page } ) => {
			await openMember( page, a.slug );
			await expect( menuLink( page, b.slug ), `${ b.slug } is in the menu` ).toBeAttached();
			await expectShown( page, a.slug );
			const leftAt = await where( page );

			await switchTo( page, b.slug );
			await expectShown( page, b.slug );
			expect( await where( page ), `${ b.slug } lands where a full load does` ).toMatch(
				b.landing
			);

			await switchTo( page, a.slug );
			await expectShown( page, a.slug );
			expect( await where( page ), `${ a.slug } comes back where it was left` ).toBe( leftAt );
		} );
	}
} );
