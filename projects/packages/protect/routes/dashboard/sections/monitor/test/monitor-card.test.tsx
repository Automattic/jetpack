import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import MonitorCard from '../monitor-card';
import type { ProtectSettingsData } from '../../../data/use-protect-settings';
import type { MonitorState, UptimeDay } from '../types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const days: UptimeDay[] = [
	{ date: '2026-03-12', status: 'monitor_inactive', downtimeInMinutes: 0 },
	{ date: '2026-03-13', status: 'down', downtimeInMinutes: 12 },
	{ date: '2026-03-14', status: 'up', downtimeInMinutes: 0 },
];

const renderCard = (
	settings: Partial< ProtectSettingsData > = {},
	state: Partial< MonitorState > = {}
) =>
	render(
		<MonitorCard
			state={ { available: true, active: true, uptimeDays: 40, userConnected: true, ...state } }
			settings={ { settings: null, isSaving: () => false, ...settings } as ProtectSettingsData }
			openSettings={ jest.fn() }
		/>
	);

describe( 'MonitorCard', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
	} );

	it.each( [
		[ 'up', true, 'Operational' ],
		[ 'down', false, 'Down' ],
		[ 'unknown', null, 'Status unknown' ],
	] )( 'shows the current status when the site is %s', async ( _name, isUp, badge ) => {
		mockApiFetch.mockResolvedValue( { days, isUp } );
		renderCard();

		await expect( screen.findByText( badge ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Uptime, last 3 days (UTC)' ) ).toBeInTheDocument();
		expect( screen.getByText( '1 day up, 1 day down, 1 day with no data' ) ).toBeInTheDocument();
		expect( screen.getAllByRole( 'listitem' ).map( item => item.textContent ) ).toEqual( [
			'March 12, 2026: no data',
			'March 13, 2026: down for 12 minutes',
			'March 14, 2026: 100% uptime',
		] );
		expect( mockApiFetch ).toHaveBeenCalledWith( { path: '/jetpack/v4/protect-dashboard/uptime' } );
	} );

	it.each( [
		[ 'Monitor is unavailable', { available: false }, null, 'Unavailable' ],
		[ 'Monitor is off', { active: false }, null, 'Off' ],
		[ 'Monitor was turned off since page load', {}, { monitor: false }, 'Off' ],
	] )( 'asks for no uptime when %s', ( _name, state, liveSettings, badge ) => {
		renderCard( { settings: liveSettings }, state );

		expect( screen.getByText( badge ) ).toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'says the history is unavailable when it cannot be loaded', async () => {
		mockApiFetch.mockRejectedValue( { code: 'not_connected' } );
		renderCard();

		await expect(
			screen.findByText( 'Uptime history is unavailable right now.' )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Status unknown' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'listitem' ) ).not.toBeInTheDocument();
	} );

	it( 'waits for a Monitor save to finish before asking for uptime', () => {
		renderCard( { settings: { monitor: true }, isSaving: key => key === 'monitor' } );

		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );
} );
