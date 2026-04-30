import { SEARCH_DASHBOARD_TAB_PLAN_USAGE, SEARCH_DASHBOARD_TAB_SETTINGS } from '../constants';
import {
	getSearchDashboardTabFromSearch,
	getSearchDashboardTabUrl,
	normalizeSearchDashboardTab,
} from '../utils';

describe( 'Search dashboard tab URL state', () => {
	it( 'defaults to the Settings tab', () => {
		expect( getSearchDashboardTabFromSearch( '?page=jetpack-search' ) ).toBe(
			SEARCH_DASHBOARD_TAB_SETTINGS
		);
	} );

	it( 'reads a valid tab from the URL search params', () => {
		expect( getSearchDashboardTabFromSearch( '?page=jetpack-search&tab=plan-usage' ) ).toBe(
			SEARCH_DASHBOARD_TAB_PLAN_USAGE
		);
	} );

	it( 'opens Plan & usage after checkout returns with just_upgraded', () => {
		expect( getSearchDashboardTabFromSearch( '?page=jetpack-search&just_upgraded=1' ) ).toBe(
			SEARCH_DASHBOARD_TAB_PLAN_USAGE
		);
	} );

	it( 'normalizes unknown tab values to Settings', () => {
		expect( normalizeSearchDashboardTab( 'analytics' ) ).toBe( SEARCH_DASHBOARD_TAB_SETTINGS );
	} );

	it( 'preserves existing URL params when writing tab state', () => {
		expect(
			getSearchDashboardTabUrl(
				SEARCH_DASHBOARD_TAB_PLAN_USAGE,
				'https://example.com/wp-admin/admin.php?page=jetpack-search&just_upgraded=1'
			)
		).toBe(
			'https://example.com/wp-admin/admin.php?page=jetpack-search&just_upgraded=1&tab=plan-usage'
		);
	} );
} );
