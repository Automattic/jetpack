jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual( '../../../../../tests/js/route-test-utils' );

	return mockWordPressRoute;
} );

/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { HostLink } from '@wordpress/widget-primitives';
import { createRef } from 'react';
/**
 * Internal dependencies
 */
import { getMockRouteLinkUrl } from '../../../../../tests/js/route-test-utils';
import { DASHBOARD_PAGE_SLUG } from '../../dashboard-href';
import { DashboardWidgetHostProvider } from '../dashboard-widget-host-provider';
import { toRouteTarget } from '../to-route-target';

const BASE = `https://example.com/wp-admin/admin.php?page=${ DASHBOARD_PAGE_SLUG }`;
const REFERRERS_HREF = `admin.php?page=${ DASHBOARD_PAGE_SLUG }&p=%2Freports%2Freferrers`;

function useDashboardLinkSearch() {
	return { from: '2026-03-01', to: '2026-03-10', ds: 'traffic' };
}

describe( 'DashboardWidgetHostProvider', () => {
	it( 'mounts the router link for an action href that targets a dashboard route', () => {
		render(
			<DashboardWidgetHostProvider base={ BASE }>
				<HostLink href={ `${ REFERRERS_HREF }%3Ffrom%3D2026-03-01%26to%3D2026-03-10` }>
					View all
				</HostLink>
			</DashboardWidgetHostProvider>
		);

		expect( screen.getByRole( 'link', { name: 'View all' } ) ).toHaveAttribute(
			'href',
			'/reports/referrers?from=2026-03-01&to=2026-03-10'
		);
	} );

	it( 'keeps a plain anchor for a href outside the dashboard', () => {
		render(
			<DashboardWidgetHostProvider base={ BASE }>
				<HostLink href="https://wordpress.com/subscribers/example.com">Manage</HostLink>
			</DashboardWidgetHostProvider>
		);

		expect( screen.getByRole( 'link', { name: 'Manage' } ) ).toHaveAttribute(
			'href',
			'https://wordpress.com/subscribers/example.com'
		);
	} );

	it( 'forwards the ref to the anchor', () => {
		const ref = createRef< HTMLAnchorElement >();

		render(
			<DashboardWidgetHostProvider base={ BASE }>
				<HostLink ref={ ref } href={ REFERRERS_HREF }>
					View all
				</HostLink>
			</DashboardWidgetHostProvider>
		);

		expect( ref.current ).toBe( screen.getByRole( 'link', { name: 'View all' } ) );
	} );

	it( 'matches against the current location when no base is given', () => {
		const { href: previous } = window.location;
		window.history.replaceState( null, '', `/wp-admin/admin.php?page=${ DASHBOARD_PAGE_SLUG }` );

		try {
			render(
				<DashboardWidgetHostProvider>
					<HostLink href={ REFERRERS_HREF }>View all</HostLink>
				</DashboardWidgetHostProvider>
			);

			expect( screen.getByRole( 'link', { name: 'View all' } ) ).toHaveAttribute(
				'href',
				'/reports/referrers'
			);
		} finally {
			window.history.replaceState( null, '', previous );
		}
	} );

	it( 'carries the search the host hook returns, the href winning on a shared key', () => {
		render(
			<DashboardWidgetHostProvider base={ BASE } useLinkSearch={ useDashboardLinkSearch }>
				<HostLink
					href={ `admin.php?page=${ DASHBOARD_PAGE_SLUG }&p=%2Freports%2Fcomments%3Fsection%3Dposts%26to%3D2026-03-05` }
				>
					View all
				</HostLink>
			</DashboardWidgetHostProvider>
		);

		const url = getMockRouteLinkUrl( screen.getByRole( 'link', { name: 'View all' } ) );
		expect( url.pathname ).toBe( '/reports/comments' );
		expect( Object.fromEntries( url.searchParams ) ).toEqual( {
			from: '2026-03-01',
			to: '2026-03-05',
			ds: 'traffic',
			section: 'posts',
		} );
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
		[
			'a decimal as the number the router reads',
			'/posts?rate=1.0',
			{ to: '/posts', search: { rate: 1 } },
		],
		[
			'an exponent as the number the router reads',
			'/posts?n=1e3',
			{ to: '/posts', search: { n: 1000 } },
		],
	] )( 'hands the router %s', ( _, path, expected ) => {
		expect( toRouteTarget( path ) ).toEqual( expected );
	} );
} );
