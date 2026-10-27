import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { recordEvent } from '../data/tracks';
import MonitorCard from '../sections/monitor/monitor-card';
import ScanSettingsCard from '../sections/scan/settings-card';
import { setScan } from '../sections/scan/store';
import type { ProtectSettingsData } from '../data/use-protect-settings';
import type { ScanState } from '../sections/scan/types';
import type { ReactElement } from 'react';

jest.mock( '../data/tracks', () => ( { recordEvent: jest.fn() } ) );
jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => jest.fn(),
} ) );

const report: ScanState = {
	hasPlan: false,
	url: '#',
	error: false,
	scanning: false,
	lastChecked: '2026-10-01 10:00:00',
	threats: [],
};
window.jetpackProtectDashboard = { scan: report };

const settings = {
	settings: null,
	isSaving: () => false,
	refresh: jest.fn(),
} as unknown as ProtectSettingsData;
const GET_SCAN = 'Get Scan for daily malware scanning and one-click fixes';
const beacon = { use_beacon: true };

// jsdom can't navigate, and the links under test are real hrefs.
const preventNavigation = ( event: MouseEvent ) => event.preventDefault();
beforeAll( () => document.addEventListener( 'click', preventNavigation ) );

beforeEach( () => {
	( recordEvent as jest.Mock ).mockReset();
	( apiFetch as unknown as jest.Mock ).mockReset().mockResolvedValue( [] );
	setScan( () => report );
} );

afterAll( () => document.removeEventListener( 'click', preventNavigation ) );

it.each( [
	[
		'the Settings Get Scan link',
		() => <ScanSettingsCard state={ report } settings={ settings } openTab={ jest.fn() } />,
		GET_SCAN,
		[ [ 'jetpack_protect_scan_settings_get_scan_link_click', beacon ] ],
	],
	[
		'nothing for the server credentials link',
		() => (
			<ScanSettingsCard
				state={ { ...report, hasPlan: true } }
				settings={ settings }
				openTab={ jest.fn() }
			/>
		),
		'Manage server credentials',
		[],
	],
	[
		'the Monitor connect link',
		() => (
			<MonitorCard
				state={ { available: true, active: true, uptimeDays: 30, userConnected: false } }
				settings={ settings }
				openTab={ jest.fn() }
			/>
		),
		'Connect your account',
		[ [ 'jetpack_protect_monitor_connect_link_click', beacon ] ],
	],
] )( 'records %s', async ( _name, renderCard: () => ReactElement, link, expected ) => {
	render( renderCard() );

	await userEvent.click( screen.getByRole( 'link', { name: new RegExp( link ) } ) );

	expect( ( recordEvent as jest.Mock ).mock.calls ).toEqual( expected );
} );
