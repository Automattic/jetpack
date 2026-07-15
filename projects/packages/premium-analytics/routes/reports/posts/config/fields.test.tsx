/**
 * External dependencies
 */
import { useSiteHomeUrl, type StatsTopPostsItem } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { getPostsFields } from './fields';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	useSiteHomeUrl: jest.fn(),
} ) );

const mockUseSiteHomeUrl = useSiteHomeUrl as jest.MockedFunction< typeof useSiteHomeUrl >;

const homepage: StatsTopPostsItem = {
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
function renderTitleField( item: StatsTopPostsItem ) {
	const field = getPostsFields().find( candidate => candidate.id === 'title' );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` here is the DataViews field render component, not RTL's render result.
	const TitleField = field?.render;

	if ( ! field || ! TitleField ) {
		throw new Error( 'Posts title field render callback is unavailable' );
	}

	return render( <TitleField item={ item } field={ field as never } /> );
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
} );
