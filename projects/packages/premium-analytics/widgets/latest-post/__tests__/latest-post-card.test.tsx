/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { LatestPostCard } from '../render';
import type { LatestPostWithMetrics } from '../use-latest-post';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const post = {
	title: 'Quarterly update',
	url: 'https://example.com/quarterly-update/',
	date: '2026-06-05T00:00:00+00:00',
	views: 42,
	likeCount: 3,
	commentCount: 1,
} as unknown as LatestPostWithMetrics;

describe( 'LatestPostCard', () => {
	it( 'links the title to the post', () => {
		render( <LatestPostCard post={ post } /> );

		// `openInNewTab` appends a screen-reader hint to the accessible name.
		expect( screen.getByRole( 'link', { name: /^Quarterly update/ } ) ).toHaveAttribute(
			'href',
			'https://example.com/quarterly-update/'
		);
	} );

	// The title used to be wrapped in `<Link>` unconditionally, so a revert here is plausible.
	it( 'keeps the title readable as plain text when the post URL is unsafe', () => {
		render(
			<LatestPostCard post={ { ...post, url: 'javascript:alert(1)' } as LatestPostWithMetrics } />
		);

		expect( screen.getByText( 'Quarterly update' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );
} );
