import { test, expect } from '@playwright/test';
import {
	FORMS_LEAK,
	MEMBERS,
	SETTINGS_BLANK,
	expectShown,
	installShellProbe,
	intermittentSpikeBug,
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
		a: FORMS,
		reason: FORMS_LEAK,
	},
	{
		b: FORMS,
		reason: 'Spike bug: switching to Forms sets the title to "Forms", not "Jetpack Forms".',
	},
];

/* Intermittent, so retried rather than expected to fail. */
const INTERMITTENT: { a: string; b: string; reason: string }[] = [
	{ a: 'my-jetpack', b: 'jetpack-settings', reason: SETTINGS_BLANK },
];

/* Matrix rows skip this check; the test at the bottom expects it to fail. Delete both together. */
const HIGHLIGHT_BUG = {
	slug: 'my-jetpack',
	reason:
		'Spike bug: back on My Jetpack, no sidebar item is highlighted (it matches the top-level link).',
};

test.describe( 'Admin shell: navigation matrix', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	for ( const [ a, b ] of pairs ) {
		const flaky = INTERMITTENT.find( row => row.a === a.slug && row.b === b.slug );
		intermittentSpikeBug( flaky?.reason, () => {
			test( `${ a.slug } → ${ b.slug } → ${ a.slug }`, async ( { page } ) => {
				const bug = SPIKE_BUGS.find(
					row => ( ! row.a || row.a === a.slug ) && ( ! row.b || row.b === b.slug )
				);
				test.fail( !! bug, bug?.reason );
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
				await expectShown( page, a.slug, { sidebar: a.slug !== HIGHLIGHT_BUG.slug } );
				expect( await where( page ), `${ a.slug } comes back where it was left` ).toBe( leftAt );
			} );
		} );
	}

	// eslint-disable-next-line playwright/expect-expect -- expectShown() asserts.
	test( 'back on My Jetpack, its sidebar item is highlighted', async ( { page } ) => {
		const { slug, reason } = HIGHLIGHT_BUG;
		await openMember( page, slug );
		await switchTo( page, 'jetpack-newsletter' );
		await switchTo( page, slug );
		await expectShown( page, slug, { sidebar: false } );
		// Called here, so only the highlight check below is expected to fail.
		test.fail( true, reason );
		await expectShown( page, slug );
	} );
} );
