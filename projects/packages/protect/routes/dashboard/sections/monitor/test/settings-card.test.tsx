import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MonitorSettingsCard from '../settings-card';
import type { ProtectSettingsData } from '../../../data/use-protect-settings';

const MONITOR = 'Monitor your site for downtime';
const EMAIL = 'Email me when my site goes down and comes back up';

const card = ( {
	available = true,
	monitor = true,
	userConnected = true,
	saving = false,
	save = jest.fn(),
	refresh = jest.fn(),
} = {} ) => (
	<MonitorSettingsCard
		state={ { available, active: monitor, uptimeDays: 40, userConnected } }
		settings={
			{
				settings: { monitor, monitor_receive_notifications: true },
				isSaving: () => saving,
				save,
				refresh,
			} as unknown as ProtectSettingsData
		}
		openTab={ jest.fn() }
	/>
);

const renderCard = ( options: Parameters< typeof card >[ 0 ] = {} ) => render( card( options ) );

describe( 'MonitorSettingsCard', () => {
	it.each( [
		[ 'Monitor is on', {}, true, true ],
		[ 'Monitor is off', { monitor: false }, true, false ],
		[ 'Monitor is unavailable', { available: false, monitor: false }, false, false ],
		[ 'Monitor is unavailable but still set', { available: false }, false, false ],
		[ 'the user has no WordPress.com connection', { userConnected: false }, true, false ],
	] )( 'enables the right toggles when %s', ( _name, options, canToggle, canEmail ) => {
		renderCard( options );

		const enabled = ( label: string ) =>
			! screen.getByLabelText( label ).hasAttribute( 'disabled' );
		expect( enabled( MONITOR ) ).toBe( canToggle );
		expect( enabled( EMAIL ) ).toBe( canEmail );
	} );

	it( 'keeps the email toggle locked while a Monitor save is in flight', () => {
		renderCard( { saving: true } );

		expect( screen.getByLabelText( EMAIL ) ).toBeDisabled();
	} );

	it( 'keeps the email toggle locked until the re-read after turning Monitor on settles', async () => {
		let finishRefresh: () => void;
		const refresh = jest.fn(
			() =>
				new Promise< void >( resolve => {
					finishRefresh = resolve;
				} )
		);
		const save = jest.fn().mockResolvedValue( undefined );
		const { rerender } = renderCard( { monitor: false, save, refresh } );

		await userEvent.setup().click( screen.getByLabelText( MONITOR ) );
		// The Monitor save has settled and the setting now reads on; only the re-read is pending.
		rerender( card( { save, refresh } ) );
		expect( screen.getByLabelText( EMAIL ) ).toBeDisabled();

		await act( async () => finishRefresh() );
		expect( screen.getByLabelText( EMAIL ) ).toBeEnabled();
	} );

	it.each( [
		[ 'on', false, [ [ [ 'monitor_receive_notifications' ] ] ] ],
		[ 'off', true, [] ],
	] )(
		're-reads the email setting only when Monitor is turned %s',
		async ( _name, monitor, calls ) => {
			const save = jest.fn().mockResolvedValue( undefined );
			const refresh = jest.fn().mockResolvedValue( undefined );
			renderCard( { monitor, save, refresh } );

			await userEvent.setup().click( screen.getByLabelText( MONITOR ) );

			expect( save ).toHaveBeenCalledWith( { monitor: ! monitor }, undefined );
			expect( refresh.mock.calls ).toEqual( calls );
		}
	);
} );
