import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
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
} );
