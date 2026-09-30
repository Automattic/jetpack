import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@wordpress/ui';
import useAnalytics from '../../../../hooks/use-analytics';
import { InfoPopover } from '../info-popover';

jest.mock( '../../../../hooks/use-analytics' );

const mockUseAnalytics = useAnalytics as jest.MockedFunction< typeof useAnalytics >;
const recordEvent = jest.fn();

const TITLE = 'Auto-Firewall: Inactive';
const TEXT = 'Upgrade required for activation. Manual rules available.';
const TRIGGER = { name: 'More about Auto-Firewall' };

const renderPopover = ( props = {} ) =>
	render(
		<InfoPopover
			label="Auto-Firewall"
			title={ TITLE }
			text={ TEXT }
			tracksEventProps={ { location: 'auto-firewall', status: 'inactive' } }
			{ ...props }
		/>
	);

const openPanel = async () => {
	const trigger = screen.getByRole( 'button', TRIGGER );
	await userEvent.click( trigger );
	return { trigger, panel: await screen.findByRole( 'dialog' ) };
};

describe( 'InfoPopover', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockUseAnalytics.mockReturnValue( { recordEvent } );
	} );

	it( 'names the dialog by its visually hidden title and shows the text', async () => {
		renderPopover();
		const { panel } = await openPanel();

		expect( panel ).toHaveAccessibleName( TITLE );
		expect( panel ).toHaveAccessibleDescription( TEXT );
		expect( screen.getByText( TEXT ) ).toBeVisible();
	} );

	it( 'closes on Escape and returns focus to the trigger', async () => {
		renderPopover();
		const { trigger } = await openPanel();

		await userEvent.keyboard( '{Escape}' );

		await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );
		await waitFor( () => expect( trigger ).toHaveFocus() );
	} );

	it( 'records one Tracks event per open, and none on close', async () => {
		renderPopover();
		await openPanel();
		await userEvent.keyboard( '{Escape}' );
		await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );
		await openPanel();

		expect( recordEvent ).toHaveBeenCalledTimes( 2 );
		expect( recordEvent ).toHaveBeenLastCalledWith( 'jetpack_protect_card_tooltip_open', {
			page: 'my-jetpack',
			feature: 'jetpack-protect',
			location: 'auto-firewall',
			status: 'inactive',
		} );
	} );

	it( 'opens from a custom trigger', async () => {
		renderPopover( {
			trigger: (
				<Button variant="unstyled" aria-label="2 critical threats. More about threats">
					2
				</Button>
			),
		} );

		expect( screen.queryByRole( 'button', TRIGGER ) ).not.toBeInTheDocument();
		await userEvent.click(
			screen.getByRole( 'button', { name: '2 critical threats. More about threats' } )
		);

		await expect( screen.findByRole( 'dialog' ) ).resolves.toHaveAccessibleName( TITLE );
	} );
} );
