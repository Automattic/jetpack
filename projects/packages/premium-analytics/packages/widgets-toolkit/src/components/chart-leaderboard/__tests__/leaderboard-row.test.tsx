/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { category, tag } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { LeaderboardLabel } from '../leaderboard-label';
import { buildLeaderboardRow, resolveLeaderboardRowAction } from '../leaderboard-row';
import type { ReactElement } from 'react';

jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual(
		'../../../../../../tests/js/route-test-utils'
	);

	return mockWordPressRoute;
} );

function glyphPath( root: Element | null | undefined ) {
	return root?.querySelector( 'path' )?.getAttribute( 'd' );
}

// `@wordpress/icons` exports elements, so naming a glyph means rendering that
// icon on its own and comparing the two paths.
function iconPath( icon: ReactElement ) {
	const { container, unmount } = render( icon );
	const path = glyphPath( container );

	unmount();
	return path;
}

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

	it( 'swaps a thumbnail that fails to load for the placeholder', () => {
		render(
			<LeaderboardLabel
				label="Private"
				media={ { kind: 'thumbnail', url: 'https://example.com/private.jpg', alt: '' } }
			/>
		);

		const image = screen.getByRole( 'presentation' );
		fireEvent.error( image );

		expect( image ).toHaveAttribute( 'src', expect.stringMatching( /^data:image\/svg\+xml/ ) );
	} );

	it( 'draws the fallback icon when a thumbnail has no image', () => {
		render(
			<LeaderboardLabel
				label="No poster"
				media={ { kind: 'thumbnail', alt: '', fallbackIcon: category } }
			/>
		);

		expect( screen.queryByRole( 'presentation' ) ).not.toBeInTheDocument();
		expect( glyphPath( screen.getByTestId( 'leaderboard-thumbnail-placeholder' ) ) ).toBe(
			iconPath( category )
		);
	} );

	it( 'swaps a failed thumbnail for its fallback icon', () => {
		render(
			<LeaderboardLabel
				label="Private"
				media={ {
					kind: 'thumbnail',
					url: 'https://example.com/private.jpg',
					alt: '',
					fallbackIcon: category,
				} }
			/>
		);

		fireEvent.error( screen.getByRole( 'presentation' ) );

		expect( screen.queryByRole( 'presentation' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'leaderboard-thumbnail-placeholder' ) ).toBeInTheDocument();
	} );

	it( 'supports a first-class no-media label', () => {
		render( <LeaderboardLabel label="Desktop" media={ { kind: 'none' } } /> );

		expect( screen.getByText( 'Desktop' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the glyph it was handed, hidden from assistive technology', () => {
		const { container } = render(
			<LeaderboardLabel label="Recipes" media={ { kind: 'icon', icon: category } } />
		);
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the glyph is aria-hidden by design, so the DOM is the only place to reach it.
		const glyph = container.querySelector( 'svg' );

		expect( screen.getByText( 'Recipes' ) ).toBeInTheDocument();
		expect( glyph ).toHaveAttribute( 'aria-hidden', 'true' );
		// Naming the glyph rather than just counting one: an icon kind exists so a
		// widget can pick between glyphs, so the wrong one has to fail here.
		expect( glyphPath( glyph ) ).toBe( iconPath( category ) );
		expect( glyphPath( glyph ) ).not.toBe( iconPath( tag ) );
	} );
} );

describe( 'resolveLeaderboardRowAction', () => {
	const drillDown = { onClick: () => {}, ariaLabel: 'Drill' };

	it.each( [
		[
			'drills down over an href when a row has children and a handler',
			{ hasChildren: true, href: 'https://a.test', drillDown },
			{ kind: 'drillDown', ariaLabel: 'Drill' },
		],
		[
			'links a childless row with an href',
			{ hasChildren: false, href: 'https://a.test' },
			{ kind: 'link', href: 'https://a.test' },
		],
		[
			'stays static when a row has children but no handler, ignoring href',
			{ hasChildren: true, href: 'https://a.test' },
			{ kind: 'static' },
		],
		[
			'ignores a drill-down handler on a childless row',
			{ hasChildren: false, drillDown },
			{ kind: 'static' },
		],
	] )( '%s', ( _title, options, expected ) => {
		expect( resolveLeaderboardRowAction( options ) ).toMatchObject( expected );
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

		const link = screen.getByRole( 'link', { name: /Alice/ } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/alice' );
		expect( screen.getByRole( 'presentation' ) ).toHaveAttribute( 'alt', '' );
		expect( row ).not.toHaveProperty( 'onClick' );
	} );

	it( 'keeps a post link out of the chart button props', () => {
		const row = buildLeaderboardRow( {
			label: 'Pricing',
			media: { kind: 'none' },
			action: { kind: 'postLink', href: 'https://example.com/pricing/', search: {} },
		} );

		render( row.label );

		expect( screen.getByRole( 'link', { name: /Pricing/ } ) ).toHaveAttribute(
			'href',
			'https://example.com/pricing/'
		);
		expect( row ).not.toHaveProperty( 'onClick' );
	} );

	it( 'puts a video row thumbnail inside its detail link', () => {
		const row = buildLeaderboardRow( {
			label: 'Launch',
			media: {
				kind: 'thumbnail',
				url: 'https://example.com/p.jpg',
				alt: '',
				aspectRatio: '16/9',
			},
			action: { kind: 'videoLink', id: 12, search: {} },
		} );

		render( row.label );

		const link = screen.getByRole( 'link', { name: 'Launch' } );
		expect( link ).toContainElement( screen.getByRole( 'presentation' ) );
		expect( screen.getByRole( 'presentation' ) ).toHaveAttribute(
			'src',
			'https://example.com/p.jpg'
		);
	} );

	it( 'opens a video row without a valid ID as an external link around the poster and title', () => {
		const row = buildLeaderboardRow( {
			label: 'Launch',
			media: {
				kind: 'thumbnail',
				url: 'https://example.com/p.jpg',
				alt: '',
				aspectRatio: '16/9',
			},
			action: { kind: 'videoLink', href: 'https://example.com/launch/', search: {} },
		} );

		render( row.label );

		const link = screen.getByRole( 'link', { name: /Launch/ } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/launch/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toContainElement( screen.getByRole( 'presentation' ) );
	} );

	it( 'keeps post rows as a bare title link', () => {
		const row = buildLeaderboardRow( {
			label: 'Hello',
			media: { kind: 'none' },
			action: { kind: 'postLink', id: 5, search: {} },
		} );

		render( row.label );

		expect( screen.queryByRole( 'presentation' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Hello' } ) ).toBeInTheDocument();
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
