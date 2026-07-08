import { render, screen } from '@testing-library/react';
import PagesCard from '../pages-card';

describe( 'PagesCard', () => {
	it( 'maps page URLs to external links with readable labels', () => {
		render(
			<PagesCard
				pages={ [ 'https://example.com/my-post/', 'http://example.com/other' ] }
				isLoading={ false }
				isError={ false }
			/>
		);

		// The accessible name also carries Link's "(opens in a new tab)"
		// affordance, so match on the visible label.
		const first = screen.getByRole( 'link', { name: /example\.com\/my-post/ } );
		expect( first ).toHaveAttribute( 'href', 'https://example.com/my-post/' );
		expect( first ).toHaveAttribute( 'target', '_blank' );

		expect( screen.getByRole( 'link', { name: /example\.com\/other/ } ) ).toHaveAttribute(
			'href',
			'http://example.com/other'
		);

		expect(
			screen.getByRole( 'table', { name: 'Posts featuring this video' } )
		).toBeInTheDocument();
	} );

	it( 'shows an empty message when no posts feature the video', () => {
		render( <PagesCard pages={ [] } isLoading={ false } isError={ false } /> );

		expect( screen.getByText( 'No posts feature this video yet.' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'renders skeleton rows, not the empty message, while loading', () => {
		render( <PagesCard pages={ [] } isLoading isError={ false } /> );

		expect( screen.queryByText( 'No posts feature this video yet.' ) ).not.toBeInTheDocument();
		// Head row + 3 skeleton rows.
		expect( screen.getAllByRole( 'row' ) ).toHaveLength( 4 );
	} );

	it( 'shows a failure message when the query errored', () => {
		render( <PagesCard pages={ [] } isLoading={ false } isError /> );

		expect(
			screen.getByText( 'Could not load the posts featuring this video.' )
		).toBeInTheDocument();
	} );
} );
