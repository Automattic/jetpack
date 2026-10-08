import { render, screen } from '@testing-library/react';
import MonitorSettingsCard from '../settings-card';
import type { ProtectSettingsData } from '../../../data/use-protect-settings';

const renderCard = ( available: boolean, monitor: boolean ) =>
	render(
		<MonitorSettingsCard
			state={ { available, active: monitor, uptimeDays: 40 } }
			settings={
				{
					settings: { monitor, monitor_receive_notifications: true },
					isSaving: () => false,
					save: jest.fn(),
				} as unknown as ProtectSettingsData
			}
			openSettings={ jest.fn() }
		/>
	);

describe( 'MonitorSettingsCard', () => {
	it.each( [
		[ 'Monitor is on', true, true, true, true ],
		[ 'Monitor is off', true, false, true, false ],
		[ 'Monitor is unavailable', false, false, false, false ],
	] )( 'enables the right toggles when %s', ( _name, available, monitor, canToggle, canEmail ) => {
		renderCard( available, monitor );

		const enabled = ( label: string ) =>
			! screen.getByLabelText( label ).hasAttribute( 'disabled' );
		expect( enabled( 'Monitor your site for downtime' ) ).toBe( canToggle );
		expect( enabled( 'Email me when my site goes down and comes back up' ) ).toBe( canEmail );
	} );
} );
