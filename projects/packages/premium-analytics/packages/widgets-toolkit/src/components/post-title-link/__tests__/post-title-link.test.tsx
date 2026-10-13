/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { VideoTitleLink } from '../../video-title-link';
import { PostTitleLink } from '../post-title-link';

jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual(
		'../../../../../../tests/js/route-test-utils'
	);

	return mockWordPressRoute;
} );

describe.each( [
	{ name: 'PostTitleLink', TitleLink: PostTitleLink, route: '/post' },
	{ name: 'VideoTitleLink', TitleLink: VideoTitleLink, route: '/video' },
] )( '$name', ( { TitleLink, route } ) => {
	it( 'routes a row with an ID to the detail page, carrying the report window', () => {
		render(
			<TitleLink
				id={ 41 }
				label="Hello world"
				search={ { from: '2026-03-01', to: '2026-03-10' } }
			/>
		);

		expect( screen.getByRole( 'link', { name: 'Hello world' } ) ).toHaveAttribute(
			'href',
			`${ route }/41?from=2026-03-01&to=2026-03-10`
		);
	} );

	it( 'falls back to the public URL with an external marker when there is no ID', () => {
		render( <TitleLink label="Pricing" link="https://example.com/?s=pricing" /> );

		expect( screen.getByRole( 'link', { name: 'Pricing(opens in a new tab)' } ) ).toHaveAttribute(
			'href',
			'https://example.com/?s=pricing'
		);
	} );

	it( 'treats an ID of 0, such as the homepage entry, as having no detail page', () => {
		render( <TitleLink id={ 0 } label="Homepage (Latest posts)" /> );

		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Homepage (Latest posts)' ) ).toBeInTheDocument();
	} );

	it( 'renders plain text when there is no ID and the fallback URL has an unsupported scheme', () => {
		render( <TitleLink label="Sketchy" link="javascript:alert(1)" /> );

		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Sketchy' ) ).toBeInTheDocument();
	} );
} );

describe( 'PostTitleLink', () => {
	it( 'carries the public URL to the detail page', () => {
		render(
			<PostTitleLink id={ 41 } label="Hello world" link="https://example.com/hello-world/" />
		);

		const href = screen.getByRole( 'link', { name: 'Hello world' } ).getAttribute( 'href' ) ?? '';

		expect( new URL( href, 'https://example.com' ).searchParams.get( 'post_url' ) ).toBe(
			'https://example.com/hello-world/'
		);
	} );
} );

describe( 'VideoTitleLink', () => {
	it.each( [
		[ 'detail link', { id: 12 } ],
		[ 'external link', { link: 'https://example.com/launch/' } ],
		[ 'plain wrapper', {} ],
	] )( 'renders custom content in place of the label inside the %s', ( _branch, props ) => {
		render(
			<VideoTitleLink label="Launch" title="Launch" { ...props }>
				<span>custom</span>
			</VideoTitleLink>
		);

		expect( screen.getByTitle( 'Launch' ) ).toContainElement( screen.getByText( 'custom' ) );
		expect( screen.queryByText( 'Launch' ) ).not.toBeInTheDocument();
	} );
} );
