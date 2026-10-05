/**
 * External dependencies
 */
import {
	useSiteHomeUrl,
	type PostThumbnailUrls,
	type StatsTopPostsComparisonItem,
} from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import { page as pageIcon, post as postIcon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { setMockRouteSearch } from '../../../../tests/js/route-test-utils';
import { getArchivesFields, getPostsFields } from './fields';
import type { ArchiveRow } from '@jetpack-premium-analytics/widgets-toolkit';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	useSiteHomeUrl: jest.fn(),
} ) );

// The router is built dynamically at runtime, so a field-level test has no
// router to mount. Render `Link` as the anchor it becomes, keeping `to`,
// `params`, and `search` assertable, matching the other report field
// tests.
jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual( '../../../../tests/js/route-test-utils' );

	return mockWordPressRoute;
} );

setMockRouteSearch( { from: '2026-03-01', to: '2026-03-10', interval: 'day' } );

/**
 * Read an icon's SVG path, since `@wordpress/icons` exports elements with no name to compare.
 *
 * @param root - The element holding the icon.
 * @return The first path's `d` attribute.
 */
function glyphPath( root: Element ) {
	return root.querySelector( 'path' )?.getAttribute( 'd' );
}

const mockUseSiteHomeUrl = useSiteHomeUrl as jest.MockedFunction< typeof useSiteHomeUrl >;

const homepage: StatsTopPostsComparisonItem = {
	id: 0,
	label: 'Homepage (Latest posts)',
	views: 12,
	link: null,
	type: 'homepage',
};

/**
 * Mount one posts field's render component for a table row.
 *
 * @param fieldId       - The posts field to render.
 * @param item          - The top-posts row to render the cell for.
 * @param thumbnailUrls - Thumbnail URLs keyed by post ID.
 * @return The Testing Library render result.
 */
function renderPostsField(
	fieldId: 'title' | 'thumbnail',
	item: StatsTopPostsComparisonItem,
	thumbnailUrls: PostThumbnailUrls = {}
) {
	const field = getPostsFields( false, 'posts-pages', thumbnailUrls ).find(
		candidate => candidate.id === fieldId
	);
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` here is the DataViews field render component, not RTL's render result.
	const FieldRender = field?.render;

	if ( ! field || ! FieldRender ) {
		throw new Error( `Posts ${ fieldId } field render callback is unavailable` );
	}

	return render( <FieldRender item={ item } field={ field as never } /> );
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
	const field = getPostsFields( withComparison, 'posts-pages' ).find(
		candidate => candidate.id === 'views'
	);
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

	it( 'renders the post thumbnail', () => {
		renderPostsField(
			'thumbnail',
			{
				id: 42,
				label: 'Hello world',
				views: 12,
				link: 'https://example.com/hello-world/',
				type: 'post',
			},
			{ 42: 'https://example.com/thumb.jpg' }
		);

		expect( screen.getByRole( 'presentation' ) ).toHaveAttribute(
			'src',
			'https://example.com/thumb.jpg'
		);
	} );

	it.each( [
		[ 'page', pageIcon ],
		[ 'post', postIcon ],
		[ 'homepage', postIcon ],
	] )( 'renders the matching icon for a %s row without a thumbnail', ( type, icon ) => {
		renderPostsField( 'thumbnail', { ...homepage, type } );

		expect( glyphPath( screen.getByTestId( 'report-thumbnail-placeholder' ) ) ).toBe(
			glyphPath( render( icon ).container )
		);
	} );

	it( 'links the homepage row to the site home URL', () => {
		mockUseSiteHomeUrl.mockReturnValue( 'https://example.com/' );

		renderPostsField( 'title', homepage );

		// The homepage has no post-detail page, so its title is the outbound link
		// and carries the external-link marker.
		const link = screen.getByRole( 'link', {
			name: 'Homepage (Latest posts)(opens in a new tab)',
		} );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'renders plain text when the site home URL is unavailable', () => {
		mockUseSiteHomeUrl.mockReturnValue( undefined );

		renderPostsField( 'title', homepage );

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

	it( 'drills a row with a post ID into the post detail page, carrying the date range', () => {
		renderPostsField( 'title', {
			id: 42,
			label: 'Hello world',
			views: 12,
			link: 'https://example.com/hello-world/',
			type: 'post',
		} );

		const link = screen.getByRole( 'link', { name: 'Hello world' } );
		const href = link.getAttribute( 'href' ) ?? '';
		const search = new URL( href, 'https://example.com' ).searchParams;

		expect( href ).toContain( '/post/42' );
		// The detail page must open on the range the report is showing, not
		// reseed its own defaults.
		expect( search.get( 'from' ) ).toBe( '2026-03-01' );
		expect( search.get( 'to' ) ).toBe( '2026-03-10' );
		expect( search.get( 'post_url' ) ).toBe( 'https://example.com/hello-world/' );
		// A row with a detail page carries no link out to the live post.
		expect( link ).not.toHaveAttribute( 'target' );
		// The referring report travels in the URL so the detail breadcrumb can
		// link back to the tab the visitor came from.
		expect( search.get( 'ref' ) ).toBe( 'posts' );
		expect( search.get( 'ref_section' ) ).toBe( 'posts-pages' );
	} );

	// Guards against a malformed row linking to `/post/undefined`.
	it( 'renders a row with no post ID and no URL as plain text rather than a broken link', () => {
		renderPostsField( 'title', { label: 'Uncategorized', views: 3, link: null, type: 'post' } );

		expect( screen.getByText( 'Uncategorized' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'falls back to the public URL when a row has no post ID', () => {
		renderPostsField( 'title', {
			label: 'Uncategorized',
			views: 3,
			link: 'https://example.com/uncategorized/',
			type: 'post',
		} );

		const link = screen.getByRole( 'link', {
			name: 'Uncategorized(opens in a new tab)',
		} );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/uncategorized/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
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
		expect( screen.getByRole( 'img', { name: '(opens in a new tab)' } ) ).toBeInTheDocument();
	} );
} );
