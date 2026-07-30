/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import LatestPost, { LatestPostCard } from '../render';
import { useLatestPost, type LatestPostWithMetrics } from '../use-latest-post';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '../use-latest-post', () => ( {
	...jest.requireActual( '../use-latest-post' ),
	useLatestPost: jest.fn(),
} ) );

const mockUseLatestPost = useLatestPost as jest.MockedFunction< typeof useLatestPost >;

const post = {
	id: 12,
	title: 'Quarterly update',
	url: 'https://example.com/quarterly-update/',
	date: '2026-06-05T00:00:00+00:00',
	views: 42,
	likeCount: 3,
	commentCount: 1,
} as unknown as LatestPostWithMetrics;

describe( 'LatestPostCard', () => {
	beforeEach( () => {
		mockUseLatestPost.mockReset();
	} );

	it( 'carries the widget report window into the detail link', () => {
		mockUseLatestPost.mockReturnValue( {
			post,
			isLoading: false,
			isFetching: false,
			isError: false,
			refetch: jest.fn(),
		} );

		render(
			<LatestPost
				attributes={ {
					reportParams: {
						from: '2026-06-01',
						to: '2026-06-30',
						interval: 'day',
					},
				} }
			/>
		);

		const link = screen.getByRole( 'link', { name: 'Quarterly update' } );
		const url = new URL( link.getAttribute( 'href' ) ?? '', 'https://example.com' );

		expect( url.pathname ).toBe( '/post/12' );
		expect( url.searchParams.get( 'from' ) ).toBe( '2026-06-01' );
		expect( url.searchParams.get( 'to' ) ).toBe( '2026-06-30' );
	} );

	it( 'links the title to the post detail page and carries the report window', () => {
		render( <LatestPostCard post={ post } detailSearch={ { from: '2026-06-01' } } /> );

		const link = screen.getByRole( 'link', { name: 'Quarterly update' } );
		const url = new URL( link.getAttribute( 'href' ) ?? '', 'https://example.com' );

		expect( url.pathname ).toBe( '/post/12' );
		expect( url.searchParams.get( 'from' ) ).toBe( '2026-06-01' );
		expect( url.searchParams.get( 'post_url' ) ).toBe( 'https://example.com/quarterly-update/' );
	} );

	it( 'falls back to the published post when there is no post ID', () => {
		render( <LatestPostCard post={ { ...post, id: undefined } as LatestPostWithMetrics } /> );

		const link = screen.getByRole( 'link', { name: /Quarterly update/ } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/quarterly-update/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );

	// The title used to be wrapped in `<Link>` unconditionally, so a revert here is plausible.
	it( 'keeps the title readable as plain text when the post URL is unsafe', () => {
		render(
			<LatestPostCard
				post={
					{ ...post, id: undefined, url: 'javascript:alert(1)' } as unknown as LatestPostWithMetrics
				}
			/>
		);

		expect( screen.getByText( 'Quarterly update' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );
} );
