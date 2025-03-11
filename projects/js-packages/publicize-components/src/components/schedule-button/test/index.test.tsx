import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import * as wpdate from '@wordpress/date';
import ScheduleButton from '../index';

const originalGetSettings = wpdate.getSettings;

const mockGetSettings = ( abbr = '+00', offset = 0, offsetFormatted = '0', string = 'UTC' ) => {
	jest.spyOn( wpdate, 'getSettings' ).mockImplementation( () => ( {
		...originalGetSettings(),
		timezone: {
			abbr,
			offset,
			offsetFormatted,
			string,
		},
	} ) );
};

describe( 'ScheduleButton', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should convert date string to correct unix timestamp on change', async () => {
		const initialDate = new Date( '2023-10-01T12:00:00Z' );
		const expectedDate = new Date( '2023-10-02T12:00:00Z' );
		const initialUnixTimestamp = Math.floor( initialDate.getTime() / 1000 );
		const expectedUnixTimestamp = Math.floor( expectedDate.getTime() / 1000 );
		const user = userEvent.setup();

		const mockOnChange = jest.fn();
		mockGetSettings();
		render(
			<ScheduleButton onChange={ mockOnChange } scheduleTimestamp={ initialUnixTimestamp } />
		);

		const scheduleButton = screen.getByRole( 'button', { name: /schedule/i } );
		await user.click( scheduleButton );

		expect(
			screen.getByRole( 'button', { name: 'October 1, 2023. Selected' } )
		).toBeInTheDocument();
		const datePicker = screen.getByRole( 'button', { name: 'October 2, 2023' } );
		await user.click( datePicker );

		expect( mockOnChange ).toHaveBeenCalledWith( expectedUnixTimestamp );
	} );

	it( 'should convert date string to correct unix timestamp, in the current timezone, on change', async () => {
		const initialDate = new Date( '2023-10-01T12:00:00+05:00' );
		const expectedDate = new Date( '2023-10-02T12:00:00+05:00' );
		const initialUnixTimestamp = Math.floor( initialDate.getTime() / 1000 );
		const expectedUnixTimestamp = Math.floor( expectedDate.getTime() / 1000 );
		const user = userEvent.setup();

		const mockOnChange = jest.fn();
		mockGetSettings( '+05', 5, '5', 'Indian/Maldives' );
		render(
			<ScheduleButton onChange={ mockOnChange } scheduleTimestamp={ initialUnixTimestamp } />
		);

		const scheduleButton = screen.getByRole( 'button', { name: /schedule/i } );
		await user.click( scheduleButton );

		const hoursInput = screen.getByLabelText( 'Hours' );
		const minutesInput = screen.getByLabelText( 'Minutes' );

		expect(
			screen.getByRole( 'button', { name: 'October 1, 2023. Selected' } )
		).toBeInTheDocument();
		expect( hoursInput ).toHaveValue( 12 );
		expect( minutesInput ).toHaveValue( 0 );
		const datePicker = screen.getByRole( 'button', { name: 'October 2, 2023' } );
		await user.click( datePicker );

		expect( mockOnChange ).toHaveBeenCalledWith( expectedUnixTimestamp );
		expect( hoursInput ).toHaveValue( 12 );
		expect( minutesInput ).toHaveValue( 0 );
	} );

	it( 'should call onConfirm when confirm button is clicked', async () => {
		const user = userEvent.setup();
		const mockOnConfirm = jest.fn();

		render( <ScheduleButton onConfirm={ mockOnConfirm } /> );

		const scheduleButton = screen.getByRole( 'button', { name: /schedule/i } );
		await user.click( scheduleButton );

		const confirmButton = screen.getByText( 'Confirm' );
		await user.click( confirmButton );

		expect( mockOnConfirm ).toHaveBeenCalled();
	} );
} );
