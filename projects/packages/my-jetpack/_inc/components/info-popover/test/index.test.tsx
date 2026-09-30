import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@wordpress/ui';
import { InfoPopover } from '../';
import useAnalytics from '../../../hooks/use-analytics';

jest.mock( '../../../hooks/use-analytics' );

const mockUseAnalytics = useAnalytics as jest.MockedFunction< typeof useAnalytics >;
const recordEvent = jest.fn();

const TITLE = 'Backups: Up to date';
const TEXT = 'Your last backup finished an hour ago.';
const TRIGGER = { name: 'More about Backups' };

const renderPopover = ( props = {} ) =>
	render(
		<InfoPopover
			label="Backups"
			title={ TITLE }
			text={ TEXT }
			tracksEventName="example_tooltip_open"
			tracksEventProps={ { location: 'backups' } }
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
		expect( recordEvent ).toHaveBeenLastCalledWith( 'jetpack_example_tooltip_open', {
			page: 'my-jetpack',
			location: 'backups',
		} );
	} );

	it( 'records nothing without a Tracks event name', async () => {
		renderPopover( { tracksEventName: undefined } );
		await openPanel();

		expect( recordEvent ).not.toHaveBeenCalled();
	} );

	it( 'opens from a custom trigger', async () => {
		renderPopover( {
			trigger: (
				<Button variant="unstyled" aria-label="2 failed backups. More about backups">
					2
				</Button>
			),
		} );

		expect( screen.queryByRole( 'button', TRIGGER ) ).not.toBeInTheDocument();
		await userEvent.click(
			screen.getByRole( 'button', { name: '2 failed backups. More about backups' } )
		);

		await expect( screen.findByRole( 'dialog' ) ).resolves.toHaveAccessibleName( TITLE );
	} );
} );
