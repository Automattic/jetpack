/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { file as categoryGlyph, tag } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { captureCsvDownloads } from '../../test-utils';
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

/** The query string of every `stats/tags` request so far. */
function tagsRequests(): URLSearchParams[] {
	return mockApiFetch.mock.calls
		.map( ( [ options ] ) => String( options?.path ?? '' ) )
		.filter( path => path.includes( 'stats/tags' ) )
		.map( path => new URLSearchParams( path.split( '?' )[ 1 ] ) );
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

		const categoryPath = iconPath( categoryGlyph );
		const tagPath = iconPath( tag );

		expect( categoryPath ).not.toBe( tagPath );
		expect( rowGlyphPath( 'Recipes' ) ).toBe( categoryPath );
		expect( rowGlyphPath( 'vegan' ) ).toBe( tagPath );
		expect( rowLink( 'vegan' ) ).toHaveAttribute( 'href', 'https://example.com/tag/vegan/' );
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
		expect( rowGlyphPath( 'Desserts' ) ).toBe( iconPath( categoryGlyph ) );
		expect( rowGlyphPath( 'chocolate' ) ).toBe( iconPath( tag ) );

		fireEvent.click( screen.getByRole( 'button', { name: /all tags & categories/i } ) ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.

		await expect( screen.findByText( 'Recipes' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'chocolate' ) ).not.toBeInTheDocument();
	} );

	// The same module in Jetpack Stats prints the count in full, and the two are read side
	// by side, so a compacted "1.2K" reads as different data, not rounding (WOOA7S-2018).
	it( 'prints view counts in full rather than compacting them', async () => {
		render( <TagsWidget attributes={ { reportParams: getDefaultQueryParams() } } /> );

		await expect( screen.findByText( '1,240' ) ).resolves.toBeInTheDocument();
		// A compacted count is drawn aria-hidden, with the full figure left to screen readers.
		expect(
			screen.queryByText(
				( text, node ) => !! text && node?.getAttribute( 'aria-hidden' ) === 'true'
			)
		).not.toBeInTheDocument();
	} );

	// Calypso sends no query, so Jetpack Stats gets the endpoint's default of 10.
	it( 'asks for the row count Jetpack Stats gets by default, over the dashboard window', async () => {
		render( <TagsWidget attributes={ { reportParams: getDefaultQueryParams() } } /> );

		await expect( screen.findByText( 'Recipes' ) ).resolves.toBeInTheDocument();

		const requested = tagsRequests();
		expect( requested ).not.toHaveLength( 0 );
		requested.forEach( params => {
			expect( params.get( 'max' ) ).toBe( '10' );
			expect( params.get( 'date' ) ).toBe( getDefaultQueryParams().to );
			expect( params.get( 'start_date' ) ).toBe( getDefaultQueryParams().from );
		} );
	} );

	it( 'refetches with the new window when the dashboard period changes', async () => {
		const { rerender } = render(
			<TagsWidget attributes={ { reportParams: getDefaultQueryParams() } } />
		);
		await expect( screen.findByText( 'Recipes' ) ).resolves.toBeInTheDocument();

		rerender(
			<TagsWidget
				attributes={ {
					reportParams: {
						...getDefaultQueryParams(),
						preset: undefined,
						from: '2026-01-01T00:00:00.000+00:00',
						to: '2026-01-31T23:59:59.999+00:00',
					},
				} }
			/>
		);

		await waitFor( () =>
			expect( tagsRequests().map( params => params.get( 'start_date' ) ) ).toContain(
				'2026-01-01T00:00:00.000+00:00'
			)
		);
		expect( tagsRequests().at( -1 )?.get( 'date' ) ).toBe( '2026-01-31T23:59:59.999+00:00' );
	} );
} );

describe( 'TagsWidget CSV export', () => {
	let downloads: ReturnType< typeof captureCsvDownloads >;

	const FULL_REPORT = {
		...TAGS_RESPONSE,
		tags: [
			...TAGS_RESPONSE.tags,
			...Array.from( { length: 9 }, ( _, index ) => ( {
				tags: [
					{ type: 'tag', name: `tag-${ index }`, link: `https://example.com/tag/${ index }/` },
				],
				views: 100 - index,
			} ) ),
		],
	};

	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		mockApiFetch.mockReset();
		downloads = captureCsvDownloads();
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve( path.includes( 'max=1000' ) ? FULL_REPORT : TAGS_RESPONSE )
		);
	} );

	afterEach( () => {
		jest.useRealTimers();
		downloads.restore();
	} );

	it( 'downloads the whole Tags report while drilled into a group', async () => {
		render( <TagsWidget attributes={ { reportParams: getDefaultQueryParams() } } /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click(
			await screen.findByRole( 'button', {
				name: /view the tags and categories in desserts, chocolate/i,
			} )
		);
		await expect(
			screen.findByRole( 'button', { name: /all tags & categories/i } )
		).resolves.toBeInTheDocument();
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click( screen.getByRole( 'button', { name: /Download CSV/ } ) );
		await waitFor( () => expect( downloads.files ).toHaveLength( 1 ) );

		const lines = await downloads.lines();
		expect( lines[ 0 ] ).toBe( '"Tag or category","Views","URL"' );
		expect( lines ).toContain( '"Desserts, chocolate","760",""' );
		expect( lines ).toHaveLength( 13 );
		// The window is part of the export now, so the filename names it.
		expect( downloads.files[ 0 ].filename ).toMatch(
			/^tags-and-categories-\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}\.csv$/
		);
	} );
} );
