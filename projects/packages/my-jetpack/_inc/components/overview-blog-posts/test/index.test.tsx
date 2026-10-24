import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import useSimpleQuery from '../../../data/use-simple-query';
import OverviewBlogPosts from '../index';

jest.mock( '../../../data/use-simple-query' );

const mockUseSimpleQuery = useSimpleQuery as jest.MockedFunction< typeof useSimpleQuery >;

describe( 'OverviewBlogPosts', () => {
	it.each( [
		[ 'loading', { data: undefined, isLoading: true } ],
		[ 'failed', { data: undefined, isError: true } ],
		[ 'empty', { data: [] } ],
	] )( 'renders nothing while the feed is %s', ( _, result ) => {
		mockUseSimpleQuery.mockReturnValue( result as ReturnType< typeof useSimpleQuery > );

		const { container } = render( <OverviewBlogPosts /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'links each post and dates it, with no image for a post without a thumbnail', () => {
		const post = {
			title: 'Post',
			link: 'https://jetpack.com/p/',
			date: '2026-10-15T21:24:22+00:00',
			excerpt: '',
		};
		mockUseSimpleQuery.mockReturnValue( {
			data: [ { ...post, thumbnail: null } ],
		} as ReturnType< typeof useSimpleQuery > );

		render( <OverviewBlogPosts /> );

		expect( screen.getByRole( 'link', { name: /^Post/ } ) ).toHaveAttribute( 'href', post.link );
		expect( screen.getByRole( 'time' ) ).toHaveAttribute( 'dateTime', post.date );
		expect( screen.queryByRole( 'presentation' ) ).not.toBeInTheDocument();
	} );
} );
