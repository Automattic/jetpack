/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { category, tag } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { LeaderboardLabel } from '../leaderboard-label';
import {
	buildLeaderboardRow,
	resolveLeaderboardRowAction,
	type LeaderboardRowAction,
} from '../leaderboard-row';
import type { ReactElement } from 'react';

jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual(
		'../../../../../../tests/js/route-test-utils'
	);

	return mockWordPressRoute;
} );

// Identity class names, so the chrome a look selects can be read off the row. The interop
// reads `__esModule` first, and a string there would make it take `.default` as the module.
jest.mock( '../../../../../../tests/style-stub.cjs', () => {
	return new Proxy(
		{},
		{ get: ( _, name ) => ( name === '__esModule' ? false : String( name ) ) }
	);
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

	it.each( [
		[ 'a static row', { kind: 'static' } ],
		[ 'a link row', { kind: 'link', href: 'https://example.com/' } ],
		[ 'a post link row', { kind: 'postLink', href: 'https://example.com/pricing/', search: {} } ],
	] as const )( 'drops the list chrome from %s of the bars look', ( _, action ) => {
		render(
			buildLeaderboardRow( {
				label: 'Pricing',
				media: { kind: 'none' },
				action: action as LeaderboardRowAction,
				variant: 'bars',
			} ).label
		);

		expect( screen.getByTitle( 'Pricing' ) ).toHaveClass( 'bars' );
	} );

	it( 'keeps the list chrome by default', () => {
		render(
			buildLeaderboardRow( {
				label: 'Pricing',
				media: { kind: 'none' },
				action: { kind: 'static' },
			} ).label
		);

		expect( screen.getByTitle( 'Pricing' ) ).toHaveClass( 'row' );
		expect( screen.getByTitle( 'Pricing' ) ).not.toHaveClass( 'bars' );
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

	it.each( [
		[ 'a video detail link', { kind: 'videoLink', id: 12, search: {} }, '/video/12' ],
		[ 'a post detail link', { kind: 'postLink', id: 5, search: {} }, '/post/5' ],
		[
			'a public page link',
			{ kind: 'postLink', href: 'https://example.com/hello/', search: {} },
			'https://example.com/hello/',
		],
	] as const )( 'puts the thumbnail inside %s', ( _name, action, href ) => {
		const row = buildLeaderboardRow( {
			label: 'Hello',
			media: { kind: 'thumbnail', url: 'https://example.com/p.jpg', alt: '' },
			action: action as LeaderboardRowAction,
		} );

		render( row.label );

		const link = screen.getByRole( 'link', { name: /^Hello/ } );
		expect( link ).toHaveAttribute( 'href', href );
		expect( link ).toContainElement( screen.getByRole( 'presentation' ) );
	} );

	it( 'keeps the thumbnail on a post row that links nowhere', () => {
		const row = buildLeaderboardRow( {
			label: 'Hello',
			media: { kind: 'thumbnail', url: 'https://example.com/p.jpg', alt: '' },
			action: { kind: 'postLink', href: null, search: {} },
		} );

		render( row.label );

		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		expect( screen.getByTitle( 'Hello' ) ).toContainElement( screen.getByRole( 'presentation' ) );
	} );

	it( 'adds a "View" action beside the title when a post row also has a public URL', () => {
		const row = buildLeaderboardRow( {
			label: 'Hello',
			media: { kind: 'none' },
			action: { kind: 'postLink', id: 5, href: 'https://example.com/hello/', search: {} },
		} );

		render( row.label );

		const title = screen.getByRole( 'link', { name: 'Hello' } );
		expect( title ).toHaveAttribute( 'href', expect.stringMatching( /^\/post\/5/ ) );
		// The tooltip stays on the title, so hovering the arrow shows only "View".
		expect( title ).toHaveAttribute( 'title', 'Hello' );
		const view = screen.getByRole( 'link', { name: 'View "Hello" in a new tab' } );
		expect( view ).toHaveAttribute( 'href', 'https://example.com/hello/' );
		expect( view ).toHaveAttribute( 'target', '_blank' );
		expect( view ).not.toHaveAttribute( 'title' );
		// The row chrome moves to the wrapper, so the look still applies.
		// eslint-disable-next-line testing-library/no-node-access -- The wrapper has no accessible query target.
		const wrapper = view.parentElement;
		expect( wrapper ).toHaveClass( 'row' );
		expect( wrapper ).toContainElement( title );
		// The title stretches over the row, so the click target stays the row.
		expect( title ).toHaveClass( 'titleLink' );
	} );

	it( 'links the title out, with no "View" action, when the reader cannot open post details', () => {
		Object.defineProperty( window, 'JetpackScriptData', {
			configurable: true,
			value: { premium_analytics: { sections: [ 'woocommerce' ] } },
		} );

		try {
			render(
				buildLeaderboardRow( {
					label: 'Hello',
					media: { kind: 'none' },
					action: { kind: 'postLink', id: 5, href: 'https://example.com/hello/', search: {} },
				} ).label
			);

			expect( screen.getAllByRole( 'link' ) ).toHaveLength( 1 );
			expect( screen.getByRole( 'link', { name: /^Hello/ } ) ).toHaveAttribute(
				'href',
				'https://example.com/hello/'
			);
		} finally {
			delete window.JetpackScriptData;
		}
	} );

	it( 'keeps a video row thumbnail inside its detail link, next to the "View" action', () => {
		const row = buildLeaderboardRow( {
			label: 'Launch',
			media: { kind: 'thumbnail', url: 'https://example.com/p.jpg', alt: '' },
			action: { kind: 'videoLink', id: 12, href: 'https://example.com/launch/', search: {} },
			variant: 'bars',
		} );

		render( row.label );

		expect( screen.getByRole( 'link', { name: 'Launch' } ) ).toContainElement(
			screen.getByRole( 'presentation' )
		);
		const view = screen.getByRole( 'link', { name: 'View "Launch" in a new tab' } );
		expect( view ).toHaveAttribute( 'href', 'https://example.com/launch/' );
		// eslint-disable-next-line testing-library/no-node-access -- The wrapper has no accessible query target.
		expect( view.parentElement ).toHaveClass( 'bars' );
	} );

	it( 'offers no "View" action when the public URL has an unsupported scheme', () => {
		render(
			buildLeaderboardRow( {
				label: 'Hello',
				media: { kind: 'none' },
				action: { kind: 'postLink', id: 5, href: 'javascript:alert(1)', search: {} },
			} ).label
		);

		expect( screen.getAllByRole( 'link' ) ).toHaveLength( 1 );
		const title = screen.getByRole( 'link', { name: 'Hello' } );
		expect( title ).toHaveAttribute( 'href', '/post/5' );
		// The lone link carries the row chrome itself; a two-link wrapper would take it instead.
		expect( title ).toHaveClass( 'rowLink' );
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
