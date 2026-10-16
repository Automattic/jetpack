/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { setMockRouteSearch } from '../../../../../../tests/js/route-test-utils';
import { WidgetRootContext, type WidgetRootContextValue } from '../../widget-root';
import { LeaderboardPostLabel } from '../leaderboard-post-label';

jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual(
		'../../../../../../tests/js/route-test-utils'
	);

	return mockWordPressRoute;
} );

const WIDGET_ROOT = {
	reportParams: { from: '2026-06-01' },
	navigationParams: {
		from: '2026-06-01',
		comp: '1',
		compare_from: '2026-05-01',
		compare_to: '2026-05-31',
	},
} as WidgetRootContextValue;

describe( 'LeaderboardPostLabel', () => {
	beforeEach( () => {
		setMockRouteSearch();
	} );

	it( 'links a post to its detail route with the report window, origin and tab', () => {
		render(
			<WidgetRootContext.Provider value={ WIDGET_ROOT }>
				<LeaderboardPostLabel
					id={ 12 }
					label="Hello world"
					link="https://example.com/hello/"
					section="email-opens"
					origin={ { report: 'posts', section: 'posts-pages' } }
				/>
			</WidgetRootContext.Provider>
		);

		const link = screen.getByRole( 'link', { name: 'Hello world' } );
		const url = new URL( link.getAttribute( 'href' ) ?? '', 'https://example.com' );

		expect( url.pathname ).toBe( '/post/12' );
		expect( url.searchParams.get( 'from' ) ).toBe( '2026-06-01' );
		expect( url.searchParams.get( 'comp' ) ).toBe( '1' );
		expect( url.searchParams.get( 'post_url' ) ).toBe( 'https://example.com/hello/' );
		expect( url.searchParams.get( 'section' ) ).toBe( 'email-opens' );
		expect( url.searchParams.get( 'ref' ) ).toBe( 'posts' );
		expect( url.searchParams.get( 'ref_section' ) ).toBe( 'posts-pages' );
	} );
} );
