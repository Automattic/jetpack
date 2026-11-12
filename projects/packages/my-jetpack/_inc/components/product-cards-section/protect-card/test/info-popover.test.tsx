import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useAnalytics from '../../../../hooks/use-analytics';
import { ProtectInfoPopover } from '../info-popover';

jest.mock( '../../../../hooks/use-analytics' );

const mockUseAnalytics = useAnalytics as jest.MockedFunction< typeof useAnalytics >;

describe( 'ProtectInfoPopover', () => {
	it( 'records the Protect card Tracks event on open', async () => {
		const recordEvent = jest.fn();
		mockUseAnalytics.mockReturnValue( { recordEvent } );
		render(
			<ProtectInfoPopover
				label="Auto-Firewall"
				title="Auto-Firewall: Inactive"
				text="Upgrade required for activation."
				tracksEventProps={ { location: 'auto-firewall', status: 'inactive' } }
			/>
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'More about Auto-Firewall' } ) );
		await expect( screen.findByRole( 'dialog' ) ).resolves.toBeInTheDocument();

		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_protect_card_tooltip_open', {
			page: 'my-jetpack',
			feature: 'jetpack-protect',
			location: 'auto-firewall',
			status: 'inactive',
		} );
	} );
} );
