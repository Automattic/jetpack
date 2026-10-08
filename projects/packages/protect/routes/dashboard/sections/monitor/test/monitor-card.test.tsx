import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useState } from '@wordpress/element';
import MonitorCard from '../monitor-card';
import type { ProtectSettings, ProtectSettingsData } from '../../../data/use-protect-settings';
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
			settings={
				{
					settings: null,
					isSaving: () => false,
					refresh: jest.fn(),
					...settings,
				} as ProtectSettingsData
			}
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

	it( 'offers a retry that skips the remembered failure when WordPress.com fails', async () => {
		mockApiFetch.mockRejectedValueOnce( { code: 'uptime_unavailable' } );
		mockApiFetch.mockResolvedValue( { days, isUp: true } );
		renderCard();

		await expect(
			screen.findByText( 'Uptime history is unavailable right now.' )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Status unknown' ) ).toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );

		await expect( screen.findByText( 'Operational' ) ).resolves.toBeInTheDocument();
		expect( mockApiFetch ).toHaveBeenLastCalledWith( {
			path: '/jetpack/v4/protect-dashboard/uptime?retry=1',
		} );
	} );

	it.each( [
		[ 'at page load', { userConnected: false }, 0 ],
		[ 'since page load', {}, 1 ],
	] )(
		'points a user who is not connected %s to the connection page',
		async ( _name, state, requests ) => {
			mockApiFetch.mockRejectedValue( { code: 'not_connected' } );
			renderCard( {}, state );

			await expect(
				screen.findByRole( 'link', { name: 'Connect your account' } )
			).resolves.toHaveAttribute( 'href', 'admin.php?page=my-jetpack#/connection' );
			expect( screen.getByText( 'On' ) ).toBeInTheDocument();
			expect( screen.queryByText( /^Uptime, last/ ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: 'Try again' } ) ).not.toBeInTheDocument();
			expect( mockApiFetch ).toHaveBeenCalledTimes( requests );
		}
	);

	it( 'shows Off when the server says Monitor was turned off elsewhere', async () => {
		mockApiFetch.mockRejectedValue( { code: 'monitor_inactive' } );
		const Card = () => {
			const [ live, setLive ] = useState< ProtectSettings | null >( null );
			const refresh = useCallback( async () => setLive( { monitor: false } ), [] );
			return (
				<MonitorCard
					state={ { available: true, active: true, uptimeDays: 40, userConnected: true } }
					settings={
						{ settings: live, isSaving: () => false, refresh } as unknown as ProtectSettingsData
					}
					openSettings={ jest.fn() }
				/>
			);
		};
		render( <Card /> );

		await expect( screen.findByText( 'Off' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Turn on in Settings' ) ).toBeInTheDocument();
		expect(
			screen.queryByText( 'Uptime history is unavailable right now.' )
		).not.toBeInTheDocument();
	} );

	it( 'waits for a Monitor save to finish before asking for uptime', () => {
		renderCard( { settings: { monitor: true }, isSaving: key => key === 'monitor' } );

		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );
} );
