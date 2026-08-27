/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
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
} );
