// Tests for the flag-off dashboard's storage reading.
//
// This hook, not the modernized `dashboard/components/storage-space/
// usage-details.tsx`, is what ships to readers today — so the msgid it
// carries is the one a mis-spelled placeholder actually reaches people
// through. The two copies share both msgids character for character;
// `storage-usage-details.test.tsx` covers the other side.
//
// Here rather than beside the hook, as `src/js`'s own `test/` folders
// would suggest: `tsconfig.json` includes `./src/js`, and a `.tsx` test
// under it is typechecked without the test runner's globals declared.
// Every other suite in this package lives here anyway.

import { render, screen } from '@testing-library/react';
import { resetLocaleData, setLocaleData } from '@wordpress/i18n';
import { useStorageUsageText } from '../src/js/components/backup-storage-space/storage-usage-details/use-storage-usage-text';

const GB = 2 ** 30;
const TB = 2 ** 40;

/**
 * Render the hook's output on its own.
 *
 * A `<p>` rather than a bare fragment so the line has an element of its
 * own to match against. The copy wraps the used figure in `<strong>`, so
 * this element holds only the fragments either side of it — which is all
 * Testing Library's text matcher reads — hence the search for the opening
 * word and the anchored regexes at the call sites.
 *
 * @param props           - Component props.
 * @param props.used      - Bytes of backup storage in use.
 * @param props.available - The plan's storage limit in bytes.
 * @return The reading.
 */
function Reading( { used, available }: { used: number; available?: number } ) {
	return <p>{ useStorageUsageText( used, available ) }</p>;
}

afterEach( () => {
	// Wipes every domain, which is what this function does — nothing here
	// depends on loaded translations otherwise.
	resetLocaleData();
} );

describe( 'the untranslated reading', () => {
	it( 'states both figures in gigabytes on a plan sold in them', () => {
		render( <Reading used={ 12.4 * GB } available={ 20 * GB } /> );
		expect( screen.getByText( /^Using/ ) ).toHaveTextContent( /^Using 12\.4GB of 20GB$/ );
	} );

	it( 'switches the limit to terabytes once the plan is sold in them', () => {
		render( <Reading used={ 12.4 * GB } available={ TB } /> );
		expect( screen.getByText( /^Using/ ) ).toHaveTextContent( /^Using 12GB of 1TB$/ );
	} );
} );

describe( 'the translated reading', () => {
	// English cannot tell you whether the placeholders are positional:
	// nothing moves, so `%1.1f`/`%2f` — which `@tannin/sprintf` reads as
	// widths and then fills in the order they appear — renders exactly
	// like `%1$.1f`/`%2$f` at every value. The two part company only under
	// a translation that reorders them, which is the natural phrasing in
	// plenty of languages.
	it( 'keeps used and total the right way round when a translation fronts the total', () => {
		setLocaleData(
			{
				'Using <strong>%1$.1fGB</strong> of %2$fGB': [
					'Of %2$fGB, using <strong>%1$.1fGB</strong>',
				],
				// The pre-fix spelling, carried here on purpose: without it,
				// reverting the msgid fails this test with a translation
				// that matches no key, which reads as a stale fixture and
				// invites someone to update the key and bless the bug back
				// in. With it, the failure is the transposed figures.
				'Using <strong>%1.1fGB</strong> of %2fGB': [ 'Of %2fGB, using <strong>%1.1fGB</strong>' ],
			},
			'jetpack-backup-pkg'
		);

		render( <Reading used={ 12.4 * GB } available={ 20 * GB } /> );

		// Sequential placeholders give "Of 12.4GB, using 20.0GB" here — the
		// plan reported as the usage and the usage as the plan. On the
		// screen whose job is to say whether backups are at risk, that
		// tells a reader with room to spare that they are over quota.
		expect( screen.getByText( /^Of/ ) ).toHaveTextContent( /^Of 20GB, using 12\.4GB$/ );
	} );
} );
