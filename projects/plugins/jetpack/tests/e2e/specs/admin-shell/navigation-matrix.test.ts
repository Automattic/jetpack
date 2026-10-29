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

const pairs = MEMBERS.flatMap( ( a, i ) => MEMBERS.slice( i + 1 ).map( b => [ a, b ] as const ) );

const FORMS = 'jetpack-forms-responses-wp-admin';

/* Spike bugs seen on this matrix, first match wins. Delete a row when its fix lands. */
const SPIKE_BUGS: { a?: string; b?: string; reason: string }[] = [
	{
		a: 'my-jetpack',
		b: 'jetpack-settings',
		reason: 'Spike bug: Settings renders blank when opened from My Jetpack.',
	},
	{
		a: FORMS,
		reason:
			'Spike bug: Forms leaves p=/forms in the next member’s URL, which renders "Route not found".',
	},
	{
		b: FORMS,
		reason: 'Spike bug: switching to Forms sets the title to "Forms", not "Jetpack Forms".',
	},
	{
		a: 'my-jetpack',
		reason:
			'Spike bug: back on My Jetpack, no sidebar item is highlighted (it matches the top-level link).',
	},
];

test.describe( 'Admin shell: navigation matrix', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	for ( const [ a, b ] of pairs ) {
		test( `${ a.slug } → ${ b.slug } → ${ a.slug }`, async ( { page } ) => {
			const bug = SPIKE_BUGS.find(
				row => ( ! row.a || row.a === a.slug ) && ( ! row.b || row.b === b.slug )
			);
			test.fail( !! bug, bug?.reason );
			await openMember( page, a.slug );
			test.skip( ! ( await menuLink( page, b.slug ).count() ), `${ b.slug } is not in the menu` );
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
