jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual( '../tests/js/route-test-utils' );

	return mockWordPressRoute;
} );

/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { HostLink } from '@wordpress/widget-primitives';
import { createRef } from 'react';
import { DASHBOARD_PAGE_SLUG } from '@jetpack-premium-analytics/routing';
import { DashboardSectionProvider } from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import { getMockRouteLinkUrl, setMockRouteSearch } from '../tests/js/route-test-utils';
import { AnalyticsWidgetHostProvider, toRouteTarget } from './widget-host';

const BASE = `https://example.com/wp-admin/admin.php?page=${ DASHBOARD_PAGE_SLUG }`;
const REFERRERS_HREF = `admin.php?page=${ DASHBOARD_PAGE_SLUG }&p=%2Freports%2Freferrers`;

describe( 'AnalyticsWidgetHostProvider', () => {
	it( 'mounts the router link for an action href that targets a dashboard route', () => {
		render(
			<AnalyticsWidgetHostProvider base={ BASE }>
				<HostLink href={ `${ REFERRERS_HREF }%3Ffrom%3D2026-03-01%26to%3D2026-03-10` }>
					View all
				</HostLink>
			</AnalyticsWidgetHostProvider>
		);

		const url = getMockRouteLinkUrl( screen.getByRole( 'link', { name: 'View all' } ) );
		expect( url.pathname ).toBe( '/reports/referrers' );
		expect( url.searchParams.get( 'from' ) ).toBe( '2026-03-01' );
		expect( url.searchParams.get( 'to' ) ).toBe( '2026-03-10' );
	} );

	it( 'keeps a plain anchor for a href outside the dashboard', () => {
		render(
			<AnalyticsWidgetHostProvider base={ BASE }>
				<HostLink href="https://wordpress.com/subscribers/example.com">Manage</HostLink>
			</AnalyticsWidgetHostProvider>
		);

		expect( screen.getByRole( 'link', { name: 'Manage' } ) ).toHaveAttribute(
			'href',
			'https://wordpress.com/subscribers/example.com'
		);
	} );

	it( 'forwards the ref to the anchor', () => {
		const ref = createRef< HTMLAnchorElement >();

		render(
			<AnalyticsWidgetHostProvider base={ BASE }>
				<HostLink ref={ ref } href={ REFERRERS_HREF }>
					View all
				</HostLink>
			</AnalyticsWidgetHostProvider>
		);

		expect( ref.current ).toBe( screen.getByRole( 'link', { name: 'View all' } ) );
	} );

	it( 'matches against the current location when no base is given', () => {
		const { href: previous } = window.location;
		window.history.replaceState( null, '', `/wp-admin/admin.php?page=${ DASHBOARD_PAGE_SLUG }` );

		try {
			render(
				<AnalyticsWidgetHostProvider>
					<HostLink href={ REFERRERS_HREF }>View all</HostLink>
				</AnalyticsWidgetHostProvider>
			);

			expect(
				getMockRouteLinkUrl( screen.getByRole( 'link', { name: 'View all' } ) ).pathname
			).toBe( '/reports/referrers' );
		} finally {
			window.history.replaceState( null, '', previous );
		}
	} );

	it( 'carries the dashboard report window and tab, the href winning on a shared key', () => {
		setMockRouteSearch( { from: '2026-03-01', to: '2026-03-10', interval: 'day' } );

		try {
			render(
				<AnalyticsWidgetHostProvider base={ BASE }>
					<DashboardSectionProvider section="traffic">
						<HostLink
							href={ `admin.php?page=${ DASHBOARD_PAGE_SLUG }&p=%2Freports%2Fcomments%3Fsection%3Dposts%26to%3D2026-03-05` }
						>
							View all
						</HostLink>
					</DashboardSectionProvider>
				</AnalyticsWidgetHostProvider>
			);

			const url = getMockRouteLinkUrl( screen.getByRole( 'link', { name: 'View all' } ) );
			expect( url.pathname ).toBe( '/reports/comments' );
			expect( url.searchParams.get( 'from' ) ).toBe( '2026-03-01' );
			expect( url.searchParams.get( 'to' ) ).toBe( '2026-03-05' );
			expect( url.searchParams.get( 'ds' ) ).toBe( 'traffic' );
			expect( url.searchParams.get( 'section' ) ).toBe( 'posts' );
		} finally {
			setMockRouteSearch();
		}
	} );
} );

describe( 'toRouteTarget', () => {
	it.each( [
		[ 'no query', '/reports/referrers', { to: '/reports/referrers' } ],
		[
			'a JSON-quoted value as the string the data layer compares against',
			'/reports/referrers?from=2026-03-01&comp=%221%22',
			{ to: '/reports/referrers', search: { from: '2026-03-01', comp: '1' } },
		],
		[ 'a bare number as a number', '/posts?author=12', { to: '/posts', search: { author: 12 } } ],
	] )( 'hands the router %s', ( _, path, expected ) => {
		expect( toRouteTarget( path ) ).toEqual( expected );
	} );
} );
