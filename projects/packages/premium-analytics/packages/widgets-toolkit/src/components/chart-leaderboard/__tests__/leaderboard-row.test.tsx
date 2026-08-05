/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { LeaderboardLabel } from '../leaderboard-label';
import { buildLeaderboardRow, resolveLeaderboardRowAction } from '../leaderboard-row';

describe( 'LeaderboardLabel', () => {
	it( 'renders media and text without adding row actions', () => {
		render(
			<LeaderboardLabel
				label="France"
				media={ { kind: 'flag', url: 'https://example.com/fr.png', country: 'France' } }
			/>
		);

		expect( screen.getByText( 'France' ) ).toBeInTheDocument();
		expect( screen.getByAltText( 'Flag of France' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'supports a first-class no-media label', () => {
		render( <LeaderboardLabel label="Desktop" media={ { kind: 'none' } } /> );

		expect( screen.getByText( 'Desktop' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'resolveLeaderboardRowAction', () => {
	const drillDown = { onClick: () => {}, ariaLabel: 'Drill' };

	it( 'drills down when a row has children and a drill-down handler', () => {
		expect( resolveLeaderboardRowAction( { hasChildren: true, drillDown } ) ).toMatchObject( {
			kind: 'drillDown',
			ariaLabel: 'Drill',
		} );
	} );

	it( 'prefers drill-down over an href when both are present', () => {
		expect(
			resolveLeaderboardRowAction( { hasChildren: true, href: 'https://a.test', drillDown } )
		).toMatchObject( { kind: 'drillDown' } );
	} );

	it( 'links a childless row with an href', () => {
		expect( resolveLeaderboardRowAction( { hasChildren: false, href: 'https://a.test' } ) ).toEqual(
			{ kind: 'link', href: 'https://a.test' }
		);
	} );

	it( 'stays static when a row has children but no drill-down handler, ignoring href', () => {
		expect( resolveLeaderboardRowAction( { hasChildren: true, href: 'https://a.test' } ) ).toEqual(
			{
				kind: 'static',
			}
		);
	} );

	it( 'ignores a drill-down handler on a childless row', () => {
		expect( resolveLeaderboardRowAction( { hasChildren: false, drillDown } ) ).toEqual( {
			kind: 'static',
		} );
	} );

	it( 'stays static with neither children nor href', () => {
		expect( resolveLeaderboardRowAction( { hasChildren: false } ) ).toEqual( { kind: 'static' } );
	} );
} );

describe( 'buildLeaderboardRow', () => {
	it( 'wraps links and makes their media decorative', () => {
		const row = buildLeaderboardRow( {
			label: 'Alice',
			media: { kind: 'avatar', url: 'https://example.com/alice.png', name: 'Alice' },
			action: { kind: 'link', href: 'https://example.com/alice' },
		} );

		render( row.label );

		expect( screen.getByRole( 'link', { name: /Alice/ } ) ).toHaveAttribute(
			'href',
			'https://example.com/alice'
		);
		expect( screen.getByRole( 'presentation' ) ).toHaveAttribute( 'alt', '' );
		expect( row ).not.toHaveProperty( 'onClick' );
	} );

	it( 'keeps a post link out of the chart button props', () => {
		const row = buildLeaderboardRow( {
			label: 'Pricing',
			media: { kind: 'none' },
			action: { kind: 'postLink', href: 'https://example.com/pricing/' },
		} );

		render( row.label );

		expect( screen.getByRole( 'link', { name: /Pricing/ } ) ).toHaveAttribute(
			'href',
			'https://example.com/pricing/'
		);
		expect( row ).not.toHaveProperty( 'onClick' );
	} );

	it( 'returns chart button props for a drill-down without nesting an action', () => {
		const onClick = jest.fn();
		const row = buildLeaderboardRow( {
			label: 'Alice',
			media: { kind: 'avatar', url: 'https://example.com/alice.png', name: 'Alice' },
			action: { kind: 'drillDown', onClick, ariaLabel: 'View posts by Alice' },
		} );

		render( row.label );

		expect( screen.getByAltText( 'Avatar of Alice' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
		expect( row ).toMatchObject( { onClick, ariaLabel: 'View posts by Alice' } );
	} );

	it( 'hides only the failed favicon URL across rerenders', () => {
		const row = buildLeaderboardRow( {
			label: 'Example',
			media: { kind: 'favicon', url: 'https://example.com/favicon.ico' },
			action: { kind: 'static' },
		} );

		const { rerender } = render( row.label );
		const image = screen.getByRole( 'presentation' );
		fireEvent.error( image );

		expect( screen.queryByRole( 'presentation' ) ).not.toBeInTheDocument();

		const nextRow = buildLeaderboardRow( {
			label: 'WordPress',
			media: { kind: 'favicon', url: 'https://wordpress.org/favicon.ico' },
			action: { kind: 'static' },
		} );
		rerender( nextRow.label );

		expect( screen.getByRole( 'presentation' ) ).toHaveAttribute(
			'src',
			'https://wordpress.org/favicon.ico'
		);
	} );
} );
