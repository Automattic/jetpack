// JETPACK-2311 H4 — a secondary admin on a site with no Backup plan had
// no way forward.
//
// The gate answers `secondary-admin` from connection state alone, before
// anything is known about the plan, and deliberately so: without a user
// connection the capabilities bridge can only answer 403. This screen
// therefore never learns whether the site has a plan — and it used to
// assume one, promising backups that may not exist and offering no other
// way off the page. Legacy was no better: a bare `<h2>` with no actions.
//
// The fix is the screen, not the gate: every claim now leads with its
// condition. A purchase button here was considered and rejected, because
// checkout requires a linked connection and would hand this reader a flow
// they cannot finish. Its absence is pinned below, because nothing else
// would notice it coming back.

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
