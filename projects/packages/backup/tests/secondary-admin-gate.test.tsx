// JETPACK-2311 H4 — a secondary admin on a site with no Backup plan had no way
// forward. The gate answers from connection state alone, so this screen never
// learns whether the site has a plan and every claim has to lead with its
// condition. The absence of a purchase button is pinned below, since checkout
// needs a linked connection and nothing else would notice one coming back.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factory above.
import { render, screen } from '@testing-library/react';
import SecondaryAdminScreen from '../src/dashboard/components/gates/secondary-admin';

beforeEach( () => {
	mockApiFetch.mockReset();
} );

describe( 'Secondary-admin gate', () => {
	it( 'offers no purchase action, because this reader cannot complete one', () => {
		render( <SecondaryAdminScreen /> );

		// The outside witness. Without it every absence below would pass
		// just as well on a screen that rendered nothing at all.
		expect( screen.getByRole( 'link', { name: /^Link my account$/ } ) ).toBeInTheDocument();

		expect(
			screen.queryByRole( 'link', { name: /^Get VaultPress Backup$/ } )
		).not.toBeInTheDocument();

		// By destination as well as by label, so a purchase affordance
		// cannot come back under a different name.
		for ( const link of screen.getAllByRole( 'link' ) ) {
			expect( link ).not.toHaveAttribute(
				'href',
				expect.stringContaining( 'jetpack.com/redirect' )
			);
		}
	} );

	// The query lives inside the hash on purpose: My Jetpack's router re-parses
	// the fragment, so `skip_pricing` reaches it even though PHP never sees it.
	it( "sends the reader into the account-link flow, not My Jetpack's landing page", () => {
		render( <SecondaryAdminScreen /> );

		expect( screen.getByRole( 'link', { name: /^Link my account$/ } ) ).toHaveAttribute(
			'href',
			'admin.php?page=my-jetpack#/connection?skip_pricing=true'
		);
	} );

	it( 'leads with the condition rather than promising backups outright', () => {
		// Both halves are pinned: the conditional reading of what linking
		// gets you, and the sentence naming the no-plan case. With no
		// upsell on this screen the second is the only thing telling a
		// reader on a plan-less site that linking is not the last step.
		render( <SecondaryAdminScreen /> );

		expect(
			screen.getByText( /Once your account is linked, you'll see any backups this site has/ )
		).toBeInTheDocument();
		expect( screen.getByText( /doesn't have an active Backup plan/ ) ).toBeInTheDocument();
	} );

	it( 'renders without a single request', () => {
		// Rendered with no `QueryClientProvider` in scope on purpose: a
		// screen that gained a query hook would throw "No QueryClient set"
		// here rather than quietly passing an `apiFetch` assertion that a
		// mocked-away network makes cheap.
		render( <SecondaryAdminScreen /> );

		expect( screen.getByRole( 'link', { name: /^Link my account$/ } ) ).toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );
} );
