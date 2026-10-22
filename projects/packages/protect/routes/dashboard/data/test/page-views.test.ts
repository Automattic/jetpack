import { setScan } from '../../sections/scan/store';
import { recordPageView } from '../page-views';
import { recordEvent } from '../tracks';
import type { ScanState } from '../../sections/scan/types';

jest.mock( '../tracks', () => ( { recordEvent: jest.fn() } ) );

const scan: ScanState = { hasPlan: false, url: '#', error: false, lastChecked: null };

window.jetpackProtectDashboard = { scan };

describe( 'recordPageView', () => {
	beforeEach( () => ( recordEvent as jest.Mock ).mockReset() );

	it.each( [
		[
			'overview',
			undefined,
			{ lastChecked: '2026-10-01 10:00:00' },
			[ 'jetpack_protect_admin_page_view', { has_plan: false, check_status: 'active' } ],
		],
		[
			'overview',
			undefined,
			{},
			[ 'jetpack_protect_admin_page_view', { has_plan: false, check_status: 'in_progress' } ],
		],
		[
			'overview',
			undefined,
			{ error: true },
			[ 'jetpack_protect_admin_page_view', { has_plan: false, check_status: 'error' } ],
		],
		[ 'history', undefined, {}, [ 'jetpack_protect_scan_history_page_view' ] ],
		[
			'settings',
			'monitor',
			{},
			[ 'jetpack_protect_settings_page_view', { has_plan: false, section: 'monitor' } ],
		],
	] )( 'records the %s tab (section %s, scan %j)', ( tab, section, report, expected ) => {
		setScan( () => ( { ...scan, ...report } ) );

		recordPageView( tab, section );

		expect( ( recordEvent as jest.Mock ).mock.calls ).toEqual( [ expected ] );
	} );
} );
