import { test, expect } from '@playwright/test';
import {
	MEMBERS,
	expectShown,
	installShellProbe,
	member,
	menuLink,
	openMember,
	switchTo,
	where,
} from '../../helpers/admin-shell-helper';

/* Each member against My Jetpack, as the host and as a guest; every pair would grow quadratically. */
const hub = member( 'my-jetpack' );
const pairs = MEMBERS.filter( m => m !== hub ).flatMap( m => [
	[ hub, m ] as const,
	[ m, hub ] as const,
] );

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
