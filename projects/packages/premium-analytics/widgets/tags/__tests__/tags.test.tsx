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
import { renderWithActionsHost } from '../../../tests/js/widget-host-test-utils';
import { captureCsvDownloads } from '../../test-utils';
import TagsWidget, { type TagsAttributes } from '../render';
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

// The report's 1,000-row request; a 10-row request gets only `TAGS_RESPONSE`.
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

// Each row stays a group in the view of its own type, under the same label as in All.
const GROUPED_RESPONSE = {
	...TAGS_RESPONSE,
	tags: [
		{
			tags: [
				{ type: 'tag', name: 'vegan', link: 'https://example.com/tag/vegan/' },
				{ type: 'tag', name: 'quick', link: 'https://example.com/tag/quick/' },
			],
			views: 500,
		},
		{
			tags: [
				{ type: 'category', name: 'Recipes', link: 'https://example.com/category/recipes/' },
				{ type: 'category', name: 'Dinner', link: 'https://example.com/category/dinner/' },
			],
			views: 400,
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
		expect( screen.queryByText( '1.2K' ) ).not.toBeInTheDocument();
	} );

	// Calypso sends no query, so Jetpack Stats gets the endpoint's default of 10.
	// `tags` stands in for a saved view the toggle does not offer.
	it.each( [ undefined, 'all', 'tags' ] )(
		'asks for the row count Jetpack Stats gets by default, over the dashboard window (view: %s)',
		async termType => {
			render(
				<TagsWidget
					attributes={ {
						reportParams: getDefaultQueryParams(),
						termType: termType as TagsAttributes[ 'termType' ],
					} }
				/>
			);

			await expect( screen.findByText( 'Recipes' ) ).resolves.toBeInTheDocument();

			const requested = tagsRequests();
			expect( requested ).not.toHaveLength( 0 );
			requested.forEach( params => {
				expect( params.get( 'max' ) ).toBe( '10' );
				expect( params.get( 'date' ) ).toBe( getDefaultQueryParams().to );
				expect( params.get( 'start_date' ) ).toBe( getDefaultQueryParams().from );
				expect( params.get( 'summarize' ) ).toBe( '1' );
			} );
		}
	);

	// `tag-7` ranks 11th overall, so it shows only if the view narrows the full report
	// before trimming to 10; `tag-8` would be the 11th tag.
	it.each( [
		[ 'tag', [ 'vegan', 'chocolate', 'tag-7' ], [ 'Recipes', 'Desserts', 'tag-8' ] ],
		[ 'category', [ 'Recipes', 'Desserts' ], [ 'vegan', 'chocolate' ] ],
	] as const )(
		'narrows the list to %s rows from the full report',
		async ( termType, shown, hidden ) => {
			mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
				Promise.resolve( path.includes( 'max=1000' ) ? FULL_REPORT : TAGS_RESPONSE )
			);
			render( <TagsWidget attributes={ { reportParams: getDefaultQueryParams(), termType } } /> );

			await expect( screen.findByText( shown[ 0 ] ) ).resolves.toBeInTheDocument();

			// The member split out of the mixed group links to its own archive.
			expect( rowLink( shown[ 1 ] ) ).toHaveAttribute(
				'href',
				`https://example.com/${ termType }/${ shown[ 1 ].toLowerCase() }/`
			);
			shown.forEach( label => expect( screen.getByText( label ) ).toBeInTheDocument() );
			hidden.forEach( label => expect( screen.queryByText( label ) ).not.toBeInTheDocument() );
		}
	);

	it.each( [
		[ 'tag', 'Tags', 'vegan, quick', 'All tags' ],
		[ 'category', 'Categories', 'Recipes, Dinner', 'All categories' ],
	] as const )(
		'names the %s view in its column, drill-down and back link',
		async ( termType, column, group, backLink ) => {
			mockApiFetch.mockResolvedValue( GROUPED_RESPONSE );
			render( <TagsWidget attributes={ { reportParams: getDefaultQueryParams(), termType } } /> );

			const groupButton = await screen.findByRole( 'button', {
				name: `View the ${ column.toLowerCase() } in ${ group }`,
			} );
			expect( screen.getByText( column ) ).toBeInTheDocument();

			fireEvent.click( groupButton ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.

			await expect(
				screen.findByRole( 'button', { name: backLink } )
			).resolves.toBeInTheDocument();
		}
	);

	it( 'leaves a drilled-in group when the view changes', async () => {
		mockApiFetch.mockResolvedValue( GROUPED_RESPONSE );
		const { rerender } = render(
			<TagsWidget attributes={ { reportParams: getDefaultQueryParams() } } />
		);

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click(
			await screen.findByRole( 'button', {
				name: 'View the tags and categories in vegan, quick',
			} )
		);
		await expect(
			screen.findByRole( 'button', { name: 'All tags & categories' } )
		).resolves.toBeInTheDocument();

		rerender(
			<TagsWidget attributes={ { reportParams: getDefaultQueryParams(), termType: 'tag' } } />
		);

		await expect(
			screen.findByRole( 'button', { name: 'View the tags in vegan, quick' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'All tags' } ) ).not.toBeInTheDocument();
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
		const { findDeclaredAction } = renderWithActionsHost(
			<TagsWidget attributes={ { reportParams: getDefaultQueryParams() } } />
		);

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click(
			await screen.findByRole( 'button', {
				name: /view the tags and categories in desserts, chocolate/i,
			} )
		);
		await expect(
			screen.findByRole( 'button', { name: /all tags & categories/i } )
		).resolves.toBeInTheDocument();
		await downloads.runAndSave( await findDeclaredAction( 'download-csv' ) );

		const lines = await downloads.lines();
		expect( lines[ 0 ] ).toBe( '"Tag or category","Views","URL"' );
		expect( lines ).toContain( '"Desserts, chocolate","760",""' );
		expect( lines ).toHaveLength( 13 );
	} );

	it.each( [
		[
			'tag',
			/^tags-.+\.csv$/,
			'"chocolate","760","https://example.com/tag/chocolate/"',
			/Recipes|Desserts/,
			12,
		],
		[
			'category',
			/^categories-.+\.csv$/,
			'"Desserts","760","https://example.com/category/desserts/"',
			/vegan|chocolate|tag-/,
			3,
		],
	] as const )(
		'downloads only the rows of the %s view',
		async ( termType, filename, line, others, lineCount ) => {
			const { findDeclaredAction } = renderWithActionsHost(
				<TagsWidget attributes={ { reportParams: getDefaultQueryParams(), termType } } />
			);

			await downloads.runAndSave( await findDeclaredAction( 'download-csv' ) );

			const lines = await downloads.lines();
			expect( downloads.files[ 0 ].filename ).toMatch( filename );
			expect( lines ).toContain( line );
			expect( lines.join( '\n' ) ).not.toMatch( others );
			expect( lines ).toHaveLength( lineCount );
		}
	);
} );

describe( 'TagsWidget empty state', () => {
	const NONE_RECORDED = 'You don’t have tags or categories recorded yet.';
	const GENERIC_TEXT = 'We couldn’t find results for this time period.';

	/** Whether any request so far asked core for a published post. */
	function askedForPosts() {
		return mockApiFetch.mock.calls.some( ( [ options ] ) =>
			String( options?.path ?? '' ).startsWith( '/wp/v2/posts' )
		);
	}

	/**
	 * Answer the tags report with no rows and the published-post lookup with the given posts.
	 *
	 * @param posts - The `/wp/v2/posts` response.
	 */
	function mockEmptyTags( posts: unknown[] ) {
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve( path.startsWith( '/wp/v2/posts' ) ? posts : { ...TAGS_RESPONSE, tags: [] } )
		);
	}

	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'says nothing is recorded yet when the site has no published post', async () => {
		mockEmptyTags( [] );

		render( <TagsWidget attributes={ { reportParams: getDefaultQueryParams() } } /> );

		await expect( screen.findByText( NONE_RECORDED ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( GENERIC_TEXT ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the period text when the site has a published post', async () => {
		mockEmptyTags( [ { id: 1 } ] );

		render( <TagsWidget attributes={ { reportParams: getDefaultQueryParams() } } /> );

		await expect( screen.findByText( GENERIC_TEXT ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( NONE_RECORDED ) ).not.toBeInTheDocument();
	} );

	it( 'does not ask for a published post when the list has rows', async () => {
		mockApiFetch.mockResolvedValue( TAGS_RESPONSE );

		render( <TagsWidget attributes={ { reportParams: getDefaultQueryParams() } } /> );

		await expect( screen.findByText( 'Recipes' ) ).resolves.toBeInTheDocument();
		expect( askedForPosts() ).toBe( false );
	} );
} );
