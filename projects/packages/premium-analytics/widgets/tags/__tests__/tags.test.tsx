/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { WIDGET_ROW_LIMIT } from '@jetpack-premium-analytics/widgets-toolkit';
import { fireEvent, render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { category, tag } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import TagsWidget from '../render';
import type { ReactElement } from 'react';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// `type: 'category'` is the only value the sanitizer turns into the `folder`
// glyph key, so the fixture pairs one of each against a grouped row.
const TAGS_RESPONSE = {
	date: '2026-06-22',
	period: 'month',
	tags: [
		{
			tags: [
				{ type: 'category', name: 'Recipes', link: 'https://example.com/category/recipes/' },
			],
			views: 1240,
		},
		{
			tags: [ { type: 'tag', name: 'vegan', link: 'https://example.com/tag/vegan/' } ],
			views: 980,
		},
		{
			tags: [
				{ type: 'category', name: 'Desserts', link: 'https://example.com/category/desserts/' },
				{ type: 'tag', name: 'chocolate', link: 'https://example.com/tag/chocolate/' },
			],
			views: 760,
		},
	],
};

function glyphPath( root: Element | null | undefined ) {
	return root?.querySelector( 'svg path' )?.getAttribute( 'd' );
}

// `@wordpress/icons` exports elements, so the only way to name the glyph a row
// drew is to compare it against that icon rendered on its own.
function iconPath( icon: ReactElement ) {
	const { container, unmount } = render( icon );
	const path = glyphPath( container );

	unmount();
	return path;
}

// The label text sits next to the glyph inside the row's media wrapper.
function rowGlyphPath( label: string ) {
	return glyphPath( screen.getByText( label ).parentElement );
}

// Queried through the label rather than the accessible name, which the design
// system extends with its own "opens in a new tab" copy.
function rowLink( label: string ) {
	return screen.getByText( label ).closest( 'a' );
}

describe( 'TagsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( TAGS_RESPONSE );
	} );

	it( 'draws the category glyph on a category row and the tag glyph on a tag row', async () => {
		render( <TagsWidget attributes={ { reportParams: getDefaultQueryParams() } } /> );

		await expect( screen.findByText( 'Recipes' ) ).resolves.toBeInTheDocument();

		const categoryPath = iconPath( category );
		const tagPath = iconPath( tag );

		expect( categoryPath ).not.toBe( tagPath );
		expect( rowGlyphPath( 'Recipes' ) ).toBe( categoryPath );
		expect( rowGlyphPath( 'vegan' ) ).toBe( tagPath );
	} );

	it( 'links a single tag row and wraps its glyph in the anchor', async () => {
		render( <TagsWidget attributes={ { reportParams: getDefaultQueryParams() } } /> );

		await expect( screen.findByText( 'vegan' ) ).resolves.toBeInTheDocument();

		const link = rowLink( 'vegan' );

		expect( link ).toHaveAttribute( 'href', 'https://example.com/tag/vegan/' );
		expect( glyphPath( link ) ).toBe( iconPath( tag ) );
	} );

	it( 'drills a grouped row into its members and back', async () => {
		render( <TagsWidget attributes={ { reportParams: getDefaultQueryParams() } } /> );

		const groupButton = await screen.findByRole( 'button', {
			name: /view the tags and categories in desserts, chocolate/i,
		} );

		// A grouped row has no combined archive URL, so it must not be a link.
		expect( rowLink( 'Desserts, chocolate' ) ).toBeNull();

		fireEvent.click( groupButton ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.

		// Members carry their own glyph and archive URL, unlike the group row.
		await expect( screen.findByText( 'Desserts' ) ).resolves.toBeInTheDocument();
		expect( rowLink( 'Desserts' ) ).toHaveAttribute(
			'href',
			'https://example.com/category/desserts/'
		);
		expect( rowGlyphPath( 'Desserts' ) ).toBe( iconPath( category ) );
		expect( rowGlyphPath( 'chocolate' ) ).toBe( iconPath( tag ) );

		fireEvent.click( screen.getByRole( 'button', { name: /all tags & categories/i } ) ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.

		await expect( screen.findByText( 'Recipes' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'chocolate' ) ).not.toBeInTheDocument();
	} );

	// The same module in Jetpack Stats prints the count in full, and the two are
	// read side by side. Compacting rounds to whole thousands, so 1,240 would show
	// as "1K" and read as different data rather than as rounding (WOOA7S-2018).
	it( 'prints view counts in full rather than compacting them', async () => {
		render( <TagsWidget attributes={ { reportParams: getDefaultQueryParams() } } /> );

		await expect( screen.findByText( '1,240' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( '1K' ) ).not.toBeInTheDocument();
	} );

	// The widest count a row has to hold once the compact form is gone. It gets its
	// own response because the top row is the denominator every other row's bar
	// width is drawn from, so putting it in the shared fixture would quietly
	// re-tune every other test in this file.
	it( 'prints a seven-digit count in full', async () => {
		mockApiFetch.mockResolvedValue( {
			...TAGS_RESPONSE,
			tags: [
				{
					tags: [ { type: 'tag', name: 'viral', link: 'https://example.com/tag/viral/' } ],
					views: 1234567,
				},
			],
		} );

		render( <TagsWidget attributes={ { reportParams: getDefaultQueryParams() } } /> );

		await expect( screen.findByText( '1,234,567' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( '1M' ) ).not.toBeInTheDocument();
	} );

	// WPCOM declares `max` as the only query parameter `stats/tags` accepts and
	// strips the rest, so a date would only split the cache per selected period.
	it( 'requests the endpoint with max alone', async () => {
		render( <TagsWidget attributes={ { reportParams: getDefaultQueryParams() } } /> );

		await expect( screen.findByText( 'Recipes' ) ).resolves.toBeInTheDocument();

		const requestedPaths = mockApiFetch.mock.calls
			.map( ( [ options ] ) => String( options?.path ?? '' ) )
			.filter( path => path.includes( 'stats/tags' ) );

		expect( requestedPaths ).not.toHaveLength( 0 );
		requestedPaths.forEach( path => {
			expect( path ).toContain( `max=${ WIDGET_ROW_LIMIT }` );
			expect( path ).not.toContain( 'date=' );
		} );
	} );
} );
