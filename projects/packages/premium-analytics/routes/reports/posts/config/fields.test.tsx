/**
 * External dependencies
 */
import { useSiteHomeUrl, type StatsTopPostsComparisonItem } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import {
	buildArchiveCsvRows,
	buildArchiveRows,
	getArchivesFields,
	getPostsFields,
	type ArchiveRow,
} from './fields';
import type { ReactNode } from 'react';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	useSiteHomeUrl: jest.fn(),
} ) );

// The router is built dynamically at runtime, so a field-level test has no
// router to mount. Render `Link` as the anchor it becomes, keeping `to`/
// `params` assertable, matching the other report field tests.
jest.mock( '@wordpress/route', () => ( {
	Link: ( {
		to,
		params,
		children,
	}: {
		to: string;
		params: Record< string, string >;
		children: ReactNode;
	} ) => <a href={ to.replace( /\$(\w+)/g, ( _match, key ) => params[ key ] ) }>{ children }</a>,
} ) );

const mockUseSiteHomeUrl = useSiteHomeUrl as jest.MockedFunction< typeof useSiteHomeUrl >;

const homepage: StatsTopPostsComparisonItem = {
	id: 0,
	label: 'Homepage (Latest posts)',
	views: 12,
	link: null,
	type: 'homepage',
};

/**
 * Mount the posts title field's render component for a table row.
 *
 * @param item - The top-posts row to render the title cell for.
 * @return The Testing Library render result.
 */
function renderTitleField( item: StatsTopPostsComparisonItem ) {
	const field = getPostsFields().find( candidate => candidate.id === 'title' );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` here is the DataViews field render component, not RTL's render result.
	const TitleField = field?.render;

	if ( ! field || ! TitleField ) {
		throw new Error( 'Posts title field render callback is unavailable' );
	}

	return render( <TitleField item={ item } field={ field as never } /> );
}

/**
 * Mount the archives title field's render component for a table row.
 *
 * @param item - The archive row to render the title cell for.
 * @return The Testing Library render result.
 */
function renderArchiveTitleField( item: ArchiveRow ) {
	const field = getArchivesFields().find( candidate => candidate.id === 'title' );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` here is the DataViews field render component, not RTL's render result.
	const TitleField = field?.render;

	if ( ! field || ! TitleField ) {
		throw new Error( 'Archives title field render callback is unavailable' );
	}

	return render( <TitleField item={ item } field={ field as never } /> );
}

/**
 * Mount the posts Views field for a table row.
 *
 * @param item           - The top-posts row to render.
 * @param withComparison - Whether comparison deltas are enabled.
 * @return The Testing Library render result.
 */
function renderPostViewsField( item: StatsTopPostsComparisonItem, withComparison = false ) {
	const field = getPostsFields( withComparison ).find( candidate => candidate.id === 'views' );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` here is the DataViews field render component, not RTL's render result.
	const ViewsField = field?.render;

	if ( ! field || ! ViewsField ) {
		throw new Error( 'Posts views field render callback is unavailable' );
	}

	return render( <ViewsField item={ item } field={ field as never } /> );
}

/**
 * Mount the archives Views field for a table row.
 *
 * @param item           - The archive row to render.
 * @param withComparison - Whether comparison deltas are enabled.
 * @return The Testing Library render result.
 */
function renderArchiveViewsField( item: ArchiveRow, withComparison = false ) {
	const field = getArchivesFields( withComparison ).find( candidate => candidate.id === 'views' );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` here is the DataViews field render component, not RTL's render result.
	const ViewsField = field?.render;

	if ( ! field || ! ViewsField ) {
		throw new Error( 'Archives views field render callback is unavailable' );
	}

	return render( <ViewsField item={ item } field={ field as never } /> );
}

describe( 'posts title field', () => {
	beforeEach( () => {
		mockUseSiteHomeUrl.mockReset();
	} );

	it( 'links the homepage row to the site home URL', () => {
		mockUseSiteHomeUrl.mockReturnValue( 'https://example.com/' );

		renderTitleField( homepage );

		const link = screen.getByRole( 'link', {
			name: /Homepage \(Latest posts\).*opens in a new tab/i,
		} );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
		expect( screen.getByRole( 'img', { name: '(opens in a new tab)' } ) ).toBeInTheDocument();
	} );

	it( 'renders plain text when the site home URL is unavailable', () => {
		mockUseSiteHomeUrl.mockReturnValue( undefined );

		renderTitleField( homepage );

		expect( screen.getByText( 'Homepage (Latest posts)' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the posts views delta when comparison is enabled', () => {
		renderPostViewsField( { ...homepage, views: 321, previousViews: 200 }, true );

		expect( screen.getByText( '321' ) ).toBeInTheDocument();
		expect( screen.getByText( '+61%' ) ).toBeInTheDocument();
	} );

	it( 'hides the posts views delta when comparison is disabled', () => {
		renderPostViewsField( { ...homepage, views: 321, previousViews: 200 } );

		expect( screen.queryByText( '+61%' ) ).not.toBeInTheDocument();
	} );

	it( 'drills a row with a post ID into the post detail page', () => {
		renderTitleField( {
			id: 42,
			label: 'Hello world',
			views: 12,
			link: 'https://example.com/hello-world/',
			type: 'post',
		} );

		expect( screen.getByRole( 'link', { name: 'Hello world' } ) ).toHaveAttribute(
			'href',
			'/post/42'
		);
	} );

	// Every row the API returns carries an ID, and the ID-less homepage row is
	// caught by the branch above, so this only guards against a malformed row
	// linking to `/post/undefined`.
	it( 'renders a row with no post ID as plain text rather than a broken link', () => {
		renderTitleField( { label: 'Uncategorized', views: 3, link: null, type: 'post' } );

		expect( screen.getByText( 'Uncategorized' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the archives views delta when comparison is enabled', () => {
		renderArchiveViewsField(
			{
				id: 'category-news',
				label: '/category/news',
				views: 30,
				previousViews: 20,
				isGroup: false,
			},
			true
		);

		expect( screen.getByText( '30' ) ).toBeInTheDocument();
		expect( screen.getByText( '+50%' ) ).toBeInTheDocument();
	} );
} );

describe( 'archive rows', () => {
	it( 'renders an archive with an unsafe URL as plain text', () => {
		renderArchiveTitleField( {
			id: 'search-0',
			label: 'javascript:alert(1)',
			views: 12,
			link: 'javascript:alert(1)',
			isGroup: false,
		} );

		expect( screen.getByText( 'javascript:alert(1)' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'shows an external-link icon for linked archive rows', () => {
		renderArchiveTitleField( {
			id: 'tag-analytics',
			label: 'analytics',
			views: 30,
			link: 'https://example.com/tag/analytics/',
			isGroup: false,
		} );

		const link = screen.getByRole( 'link', { name: /analytics.*opens in a new tab/i } );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
		expect( screen.getByRole( 'img', { name: '(opens in a new tab)' } ) ).toBeInTheDocument();
	} );

	it( 'falls back to Untitled for an archive row with an empty label', () => {
		expect( buildArchiveRows( [ { label: '', value: 5, children: null } ] )[ 0 ].label ).toBe(
			'Untitled'
		);
	} );

	it( 'gives every archive type the API returns a human-readable group label', () => {
		const archiveTypes = [
			'author',
			'cat',
			'date',
			'err',
			'home',
			'multiple',
			'other',
			'post_type',
			'search',
			'tag',
			'tax',
			// An archive type added after this ships falls back to its key,
			// capitalized — the API sends some of these shouty.
			'FEED',
		];

		expect(
			buildArchiveRows(
				archiveTypes.map( archiveType => ( { label: archiveType, value: 5, children: null } ) )
			).map( row => row.label )
		).toEqual( [
			'Authors',
			'Categories',
			'Dates',
			'Error',
			'Homepage (Latest posts)',
			'Aggregated',
			'Others',
			'Post types',
			'Searches',
			'Tags',
			'Taxonomies',
			'Feed',
		] );
	} );

	it( 'qualifies a nested archive row with its full ancestor path for export', () => {
		const rows = buildArchiveRows( [
			{
				label: 'tax',
				value: 30,
				children: [
					{
						label: 'post_tag',
						value: 30,
						children: [
							{
								label: 'Analytics',
								value: 30,
								link: 'https://example.com/tag/analytics/',
								children: null,
							},
						],
					},
				],
			},
		] );

		expect( buildArchiveCsvRows( rows ).map( row => row.label ) ).toEqual( [
			'Taxonomies',
			'Taxonomies > Post tag',
			'Taxonomies > Post tag > Analytics',
		] );
	} );

	it( 'preserves the archive hierarchy and uses standard archive labels', () => {
		expect(
			buildArchiveRows( [
				{
					label: 'tax',
					value: 30,
					children: [
						{
							label: 'post_tag',
							value: 30,
							children: [
								{
									label: 'Analytics',
									value: 30,
									link: 'https://example.com/tag/analytics/',
									children: null,
								},
							],
						},
					],
				},
			] )
		).toEqual( [
			{
				id: 'tax-0',
				label: 'Taxonomies',
				views: 30,
				isGroup: true,
			},
			{
				id: 'tax-0-0',
				parentId: 'tax-0',
				label: 'Post tag',
				views: 30,
				isGroup: true,
			},
			{
				id: 'tax-0-0-0',
				parentId: 'tax-0-0',
				label: 'Analytics',
				views: 30,
				link: 'https://example.com/tag/analytics/',
				isGroup: false,
			},
		] );
	} );
} );
