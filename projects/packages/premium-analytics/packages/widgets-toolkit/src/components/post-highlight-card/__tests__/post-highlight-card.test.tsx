/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { PostHighlightCard } from '../post-highlight-card';
import type { PostHighlightCardProps } from '../post-highlight-card';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type MockRouteLinkProps = {
	to: string;
	params?: Record< string, unknown >;
	search?: Record< string, unknown >;
	children: ReactNode;
} & Omit< AnchorHTMLAttributes< HTMLAnchorElement >, 'href' >;

// `forwardRef`, because the design system link that renders this forwards a ref.
jest.mock( '@wordpress/route', () => {
	const { forwardRef } = jest.requireActual( 'react' ) as typeof import('react');

	return {
		Link: forwardRef< HTMLAnchorElement, MockRouteLinkProps >(
			( { to, params, search, children, ...props }, ref ) => {
				const path = Object.entries( params ?? {} ).reduce(
					( result, [ key, value ] ) => result.replace( `$${ key }`, String( value ) ),
					to
				);
				const query = new URLSearchParams();
				Object.entries( search ?? {} ).forEach( ( [ key, value ] ) => {
					if ( value !== undefined && value !== null ) {
						query.set( key, String( value ) );
					}
				} );
				const queryString = query.toString();

				return (
					<a ref={ ref } href={ queryString ? `${ path }?${ queryString }` : path } { ...props }>
						{ children }
					</a>
				);
			}
		),
	};
} );

const props: PostHighlightCardProps = {
	title: 'Quarterly update',
	url: 'https://example.com/quarterly-update/',
	date: '2026-06-05T00:00:00+00:00',
	metrics: [
		{ key: 'views', label: 'Views', value: 42 },
		{ key: 'likes', label: 'Likes', value: 3, note: 'All-time total.' },
	],
};

describe( 'PostHighlightCard', () => {
	it( 'links the title to the detail route and carries the report window', () => {
		render(
			<PostHighlightCard
				{ ...props }
				postId={ 12 }
				detailSearch={ { from: '2026-06-01', to: '2026-06-30' } }
			/>
		);

		const href = screen.getByRole( 'link', { name: /^Quarterly update/ } ).getAttribute( 'href' );
		const url = new URL( href ?? '', 'http://localhost' );

		expect( url.pathname ).toBe( '/post/12' );
		expect( url.searchParams.get( 'from' ) ).toBe( '2026-06-01' );
		expect( url.searchParams.get( 'to' ) ).toBe( '2026-06-30' );
	} );

	it( 'falls back to the published post when there is no post ID', () => {
		render( <PostHighlightCard { ...props } /> );

		const link = screen.getByRole( 'link', { name: /^Quarterly update/ } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/quarterly-update/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'keeps the title as plain text when the post URL is unsafe', () => {
		render( <PostHighlightCard { ...props } url="javascript:alert(1)" /> );

		expect( screen.getByText( 'Quarterly update' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'links the title to the post', () => {
		render( <PostHighlightCard { ...props } /> );

		// `openInNewTab` appends a screen-reader hint to the accessible name.
		expect( screen.getByRole( 'link', { name: /^Quarterly update/ } ) ).toHaveAttribute(
			'href',
			'https://example.com/quarterly-update/'
		);
	} );

	// The title used to be wrapped in `<Link>` unconditionally, so a revert here is plausible.
	it( 'keeps the title readable as plain text when the post URL is unsafe', () => {
		render( <PostHighlightCard { ...props } url="javascript:alert(1)" /> );

		expect( screen.getByText( 'Quarterly update' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the publish line and the metric tiles', () => {
		render( <PostHighlightCard { ...props } /> );

		expect( screen.getByText( 'Post published on Jun 5, 2026' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Views' ) ).toBeInTheDocument();
		expect( screen.getByText( '42' ) ).toBeInTheDocument();
	} );

	it( 'omits the publish line when the post has no date', () => {
		render( <PostHighlightCard { ...props } date="" /> );

		expect( screen.queryByText( /^Post published on/ ) ).not.toBeInTheDocument();
	} );

	// A metric whose request failed must not be shown as a real count: on a
	// private site the Stats endpoint 403s, and "Likes 0" would be a wrong number
	// rather than a missing one.
	it( 'renders an unavailable metric as a dash, not as zero', () => {
		render(
			<PostHighlightCard
				{ ...props }
				metrics={ [
					{ key: 'views', label: 'Views', value: undefined },
					{ key: 'likes', label: 'Likes', value: 0 },
				] }
			/>
		);

		expect( screen.getByText( '—' ) ).toBeInTheDocument();
		// Spelled out for assistive tech, which may skip the dash entirely.
		expect( screen.getByText( 'Not available' ) ).toBeInTheDocument();
		// A genuine zero still renders as a number.
		expect( screen.getByText( '0' ) ).toBeInTheDocument();
	} );

	// A lifetime metric shown next to a period-scoped one must say so, and the
	// `title` tooltip alone is invisible to assistive technology.
	it( 'exposes a metric note as both a tooltip and visually hidden text', () => {
		render( <PostHighlightCard { ...props } /> );

		expect( screen.getByTitle( 'All-time total.' ) ).toBeInTheDocument();
		expect( screen.getByText( 'All-time total.' ) ).toBeInTheDocument();
	} );

	it( 'renders the featured image only when one is present', () => {
		const { rerender } = render( <PostHighlightCard { ...props } /> );

		// Scoped by name: `openInNewTab` renders its own `role="img"` link glyph.
		expect( screen.queryByRole( 'img', { name: 'Hero image' } ) ).not.toBeInTheDocument();

		rerender(
			<PostHighlightCard
				{ ...props }
				imageUrl="https://example.com/hero.jpg"
				imageAlt="Hero image"
			/>
		);

		expect( screen.getByRole( 'img', { name: 'Hero image' } ) ).toHaveAttribute(
			'src',
			'https://example.com/hero.jpg'
		);
	} );
} );
