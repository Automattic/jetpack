import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

// `--experimental-vm-modules` (true ESM): mock with `jest.unstable_mockModule`
// and import the component under test dynamically after the mocks are registered.
const navigate = jest.fn();

jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => navigate,
} ) );

const { default: DashboardNav } = await import( '../dashboard-nav' );

describe( 'DashboardNav', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'labels the /geo tab "GEO" (not "AI")', () => {
		render( <DashboardNav active="overview">content</DashboardNav> );

		expect( screen.getByRole( 'tab', { name: 'GEO' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'tab', { name: 'AI' } ) ).not.toBeInTheDocument();
	} );

	it( 'navigates to /geo when the GEO tab is selected', () => {
		render( <DashboardNav active="overview">content</DashboardNav> );

		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep (avoids lockfile churn), matching the sibling enable-seo-empty-state test.
		fireEvent.click( screen.getByRole( 'tab', { name: 'GEO' } ) );

		expect( navigate ).toHaveBeenCalledWith( { href: '/geo' } );
	} );

	it( 'shows all four tabs with Settings last', () => {
		render( <DashboardNav active="overview">content</DashboardNav> );

		expect( screen.getAllByRole( 'tab' ).map( tab => tab.textContent ) ).toEqual( [
			'Overview',
			'Content',
			'GEO',
			'Settings',
		] );
	} );

	it.each( [ 'lost', 'inside', 'outside' ] )(
		'preserves tab focus across route stages without stealing other focus (%s)',
		async movedFocus => {
			const Page = ( { active }: { active: 'overview' | 'geo' } ) => (
				<>
					<input aria-label="Editor" />
					<DashboardNav key={ active } active={ active }>
						{ active === 'geo' && movedFocus === 'inside' && (
							// eslint-disable-next-line jsx-a11y/no-autofocus -- Reproduce DataViews focusing a control on mount.
							<input aria-label="Filter" autoFocus />
						) }
					</DashboardNav>
				</>
			);
			const { rerender } = render( <Page active="overview" /> );
			const source = screen.getByRole( 'tab', { name: 'GEO' } );
			const editor = screen.getByRole( 'textbox', { name: 'Editor' } );
			act( () => source.focus() );
			// eslint-disable-next-line testing-library/prefer-user-event -- Match the existing navigation test.
			fireEvent.click( source );
			if ( movedFocus === 'outside' ) {
				act( () => editor.focus() );
			}
			rerender( <Page active="geo" /> );
			const activeTab = screen.getByRole( 'tab', { name: 'GEO' } );
			await waitFor( () => expect( movedFocus === 'outside' ? editor : activeTab ).toHaveFocus() );
			expect( activeTab ).toHaveAttribute( 'tabindex', '0' );
		}
	);

	it.each( [
		[ 'nothing has focus', false ],
		[ 'a panel control took focus while mounting', true ],
	] )(
		'focuses the new tab after a keyboard action inside another panel when %s',
		async ( _, stolen ) => {
			document.body.dataset.jetpackSeoTabFocus = 'overview';
			render(
				<DashboardNav active="content">
					{ /* eslint-disable-next-line jsx-a11y/no-autofocus -- Reproduce DataViews focusing a control on mount. */ }
					{ stolen && <input aria-label="Filter" autoFocus /> }
				</DashboardNav>
			);

			await waitFor( () => expect( screen.getByRole( 'tab', { name: 'Content' } ) ).toHaveFocus() );
			expect( document.body.dataset.jetpackSeoTabFocus ).toBeUndefined();
		}
	);

	it( 'associates every tab with its labeled panel and mounts content only in the active one', () => {
		render(
			<DashboardNav active="settings">
				<input aria-label="Setting" />
			</DashboardNav>
		);
		for ( const tab of screen.getAllByRole( 'tab' ) ) {
			// eslint-disable-next-line testing-library/no-node-access -- Check the actual ARIA relationship.
			const panel = document.getElementById( tab.getAttribute( 'aria-controls' ) ?? '' );
			expect( panel ).toHaveAttribute( 'role', 'tabpanel' );
			expect( panel ).toHaveAttribute( 'aria-labelledby', tab.id );
		}
		expect( screen.getAllByRole( 'tabpanel' ) ).toHaveLength( 1 );
		expect( screen.getByRole( 'tabpanel' ) ).toHaveAttribute( 'tabindex', '-1' );
		expect( screen.getByRole( 'tabpanel', { name: 'Settings' } ) ).toContainElement(
			screen.getByRole( 'textbox', { name: 'Setting' } )
		);
	} );
} );
