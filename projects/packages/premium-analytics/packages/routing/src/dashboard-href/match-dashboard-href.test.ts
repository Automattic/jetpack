import { DASHBOARD_PAGE_SLUG, matchDashboardHref } from './match-dashboard-href';

const BASE = `https://example.com/wp-admin/admin.php?page=${ DASHBOARD_PAGE_SLUG }&p=/`;
const PAGE = `admin.php?page=${ DASHBOARD_PAGE_SLUG }`;

describe( 'matchDashboardHref', () => {
	it.each( [
		[
			'an absolute href to this page',
			`https://example.com/wp-admin/${ PAGE }&p=/reports/referrers`,
			'/reports/referrers',
		],
		[
			'a relative href carrying the same page',
			`${ PAGE }&p=/reports/referrers`,
			'/reports/referrers',
		],
		[ 'a href without p, as the root route', PAGE, '/' ],
		[
			'the query p carries, for the route to read as search',
			`${ PAGE }&p=%2Freports%2Freferrers%3Ffrom%3D2026-03-01%26to%3D2026-03-10`,
			'/reports/referrers?from=2026-03-01&to=2026-03-10',
		],
		[
			'a comma-separated list, which both navigations read as text',
			`${ PAGE }&p=%2Freports%2Flocations%3Fsection%3Dcountries%2Ccities`,
			'/reports/locations?section=countries,cities',
		],
		[
			'a JSON-quoted value, kept encoded for the route to read back as the string',
			`${ PAGE }&p=%2Freports%2Freferrers%3Fcomp%3D%25221%2522`,
			'/reports/referrers?comp=%221%22',
		],
		[
			'a value the router reads as a number',
			`${ PAGE }&p=%2Fposts%3Fauthor%3D12`,
			'/posts?author=12',
		],
		[
			'a value the router reads as a boolean',
			`${ PAGE }&p=%2Fposts%3Fsticky%3Dtrue`,
			'/posts?sticky=true',
		],
		[
			'a value the router reads as JSON',
			`${ PAGE }&p=%2Fposts%3Fview%3D%7B%22type%22%3A%22table%22%7D`,
			'/posts?view={"type":"table"}',
		],
	] )( 'matches %s', ( _, href, expected ) => {
		expect( matchDashboardHref( href, BASE ) ).toBe( expected );
	} );

	it.each( [
		[ 'another admin page', 'admin.php?page=stats&p=/reports' ],
		[ 'another admin entry point', 'site-health.php?tab=debug' ],
		[ 'another origin', `https://other.example/wp-admin/${ PAGE }&p=/reports` ],
		[ 'a href that drops the page param', '?p=/reports' ],
		[ 'a hash', `${ PAGE }&p=/reports#section` ],
		[ 'search params beyond page and p', `${ PAGE }&p=/reports&period=7d` ],
		[ 'a duplicate page param', `${ PAGE }&page=stats&p=/reports` ],
		[ 'a duplicate p param', `${ PAGE }&p=/reports&p=/settings` ],
		[ 'a p query with a repeated key', `${ PAGE }&p=%2Fposts%3Fstatus%3Ddraft%26status%3Dpending` ],
		[ 'a p that is only a query', `${ PAGE }&p=%3Fperiod%3D7d` ],
		[ 'a p carrying an encoded hash', `${ PAGE }&p=/reports%23section` ],
		[ 'a p that is an absolute URL', `${ PAGE }&p=https://example.com` ],
		[ 'a p with a scheme', `${ PAGE }&p=mailto:hello@example.com` ],
		[ 'a protocol-relative p', `${ PAGE }&p=//example.com/reports` ],
		[ 'a relative p', `${ PAGE }&p=reports` ],
	] )( 'rejects %s', ( _, href ) => {
		expect( matchDashboardHref( href, BASE ) ).toBeNull();
	} );

	it( 'rejects an unparsable base', () => {
		expect( matchDashboardHref( PAGE, 'not a url' ) ).toBeNull();
	} );
} );
