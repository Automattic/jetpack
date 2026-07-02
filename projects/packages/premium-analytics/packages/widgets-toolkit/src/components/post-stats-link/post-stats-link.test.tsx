/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { WidgetRootContext } from '../widget-root/context';
import { PostStatsLink } from './post-stats-link';
import type { WidgetRootContextValue } from '../widget-root/context';
import type { ReactNode } from 'react';

// Stub the router's client-side link with a plain anchor exposing the resolved
// `/post/<id>` target so the in-app branch is observable without a real router.
jest.mock( '@wordpress/route', () => ( {
	Link: ( {
		to,
		params,
		search,
		children,
		className,
		title,
	}: {
		to: string;
		params: { postId: string };
		search?: ( prev: Record< string, unknown > ) => Record< string, unknown >;
		children: ReactNode;
		className?: string;
		title?: string;
	} ) => {
		const path = to.replace( '$postId', params.postId );
		const resolved = search ? search( { from: '2026-01-01' } ) : {};
		const query = new URLSearchParams( resolved as Record< string, string > ).toString();
		return (
			<a href={ query ? `${ path }?${ query }` : path } className={ className } title={ title }>
				{ children }
			</a>
		);
	},
} ) );

function renderInRoot( ui: ReactNode, isRouterAvailable: boolean ) {
	const value = {
		reportParams: {},
		isRouterAvailable,
	} as unknown as WidgetRootContextValue;

	return render( <WidgetRootContext.Provider value={ value }>{ ui }</WidgetRootContext.Provider> );
}

describe( 'PostStatsLink', () => {
	it( 'links to the in-app post detail route, carrying the current date range', () => {
		renderInRoot(
			<PostStatsLink postId={ 42 } href="https://example.com/hello/">
				Hello
			</PostStatsLink>,
			true
		);

		expect( screen.getByRole( 'link', { name: 'Hello' } ) ).toHaveAttribute(
			'href',
			'/post/42?from=2026-01-01'
		);
	} );

	it( 'falls back to the external published-post link without a router', () => {
		renderInRoot(
			<PostStatsLink postId={ 42 } href="https://example.com/hello/">
				Hello
			</PostStatsLink>,
			false
		);

		expect( screen.getByRole( 'link', { name: /Hello/ } ) ).toHaveAttribute(
			'href',
			'https://example.com/hello/'
		);
	} );

	it( 'falls back to the external link when the post ID is not a valid post reference', () => {
		renderInRoot(
			<PostStatsLink postId={ 0 } href="https://example.com/home/">
				Home
			</PostStatsLink>,
			true
		);

		expect( screen.getByRole( 'link', { name: /Home/ } ) ).toHaveAttribute(
			'href',
			'https://example.com/home/'
		);
	} );

	it( 'renders plain text when neither in-app navigation nor an href is available', () => {
		renderInRoot( <PostStatsLink>Untitled</PostStatsLink>, false );

		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Untitled' ) ).toBeInTheDocument();
	} );

	it( 'falls back to the external link when rendered outside a WidgetRoot', () => {
		// Presentational stories render the leaderboard (and this link) with no
		// provider; it must degrade instead of throwing on the missing context.
		render(
			<PostStatsLink postId={ 42 } href="https://example.com/hello/">
				Hello
			</PostStatsLink>
		);

		expect( screen.getByRole( 'link', { name: /Hello/ } ) ).toHaveAttribute(
			'href',
			'https://example.com/hello/'
		);
	} );

	it( 'carries the selected section into the in-app route search', () => {
		renderInRoot(
			<PostStatsLink postId={ 7 } section="email-opens">
				Newsletter
			</PostStatsLink>,
			true
		);

		expect( screen.getByRole( 'link', { name: 'Newsletter' } ) ).toHaveAttribute(
			'href',
			'/post/7?from=2026-01-01&section=email-opens'
		);
	} );
} );
