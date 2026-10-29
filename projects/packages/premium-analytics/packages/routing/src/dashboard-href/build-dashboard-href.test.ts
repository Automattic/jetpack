import { buildDashboardHref } from './build-dashboard-href';
import { DASHBOARD_PAGE_SLUG, matchDashboardHref } from './match-dashboard-href';

const BASE = `https://example.com/wp-admin/admin.php?page=${ DASHBOARD_PAGE_SLUG }`;

describe( 'buildDashboardHref', () => {
	it( 'writes the route and its query inside p, the way the matcher reads it back', () => {
		const href = buildDashboardHref( '/reports/referrers', {
			from: '2026-03-01',
			to: '2026-03-10',
			section: 'sources',
			post_id: undefined,
		} );

		expect( href ).toBe(
			`admin.php?page=${ DASHBOARD_PAGE_SLUG }&p=%2Freports%2Freferrers%3Ffrom%3D2026-03-01%26to%3D2026-03-10%26section%3Dsources`
		);
		expect( matchDashboardHref( href, BASE ) ).toBe(
			'/reports/referrers?from=2026-03-01&to=2026-03-10&section=sources'
		);
	} );

	it( 'keeps a quoted string value encoded, for a full page load to read it back as the string', () => {
		expect(
			matchDashboardHref( buildDashboardHref( '/reports/posts', { comp: '1' } ), BASE )
		).toBe( '/reports/posts?comp=%221%22' );
	} );

	it( 'leaves a route without params bare', () => {
		expect( buildDashboardHref( '/reports/posts' ) ).toBe(
			`admin.php?page=${ DASHBOARD_PAGE_SLUG }&p=%2Freports%2Fposts`
		);
	} );
} );
