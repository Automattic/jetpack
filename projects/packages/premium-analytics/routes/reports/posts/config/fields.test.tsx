/**
 * External dependencies
 */
import { useSiteHomeUrl, type StatsTopPostsComparisonItem } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { getArchivesFields, getPostsFields, type ArchiveRow } from './fields';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	useSiteHomeUrl: jest.fn(),
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

		const link = screen.getByRole( 'link', { name: 'Homepage (Latest posts)' } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
		// eslint-disable-next-line testing-library/no-node-access -- The external-link icon SVG has no accessible role or text to query.
		expect( link.querySelector( 'svg' ) ).toBeInTheDocument();
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

	it( 'shows the archives views delta when comparison is enabled', () => {
		renderArchiveViewsField(
			{
				id: 'category-news',
				label: '/category/news',
				views: 30,
				previousViews: 20,
			},
			true
		);

		expect( screen.getByText( '30' ) ).toBeInTheDocument();
		expect( screen.getByText( '+50%' ) ).toBeInTheDocument();
	} );
} );

describe( 'archives title field', () => {
	it( 'renders an archive with an unsafe URL as plain text', () => {
		renderArchiveTitleField( {
			id: 'search-0',
			label: 'javascript:alert(1)',
			views: 12,
			link: 'javascript:alert(1)',
		} );

		expect( screen.getByText( 'javascript:alert(1)' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );
} );
