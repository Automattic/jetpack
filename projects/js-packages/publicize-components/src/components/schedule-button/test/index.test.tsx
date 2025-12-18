import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { getSettings, setSettings } from '@wordpress/date';
import ScheduleButton from '../index';

// Mock the social store to prevent importing @wordpress/editor
jest.mock( '../../../social-store', () => ( {
	store: 'jetpack-social',
} ) );

// Mock @wordpress/data using Proxy pattern
jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const mocks = {
		useSelect: jest.fn( () => false ),
	};
	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property ] ?? target[ property ];
		},
	} );
} );

jest.mock( '../../../hooks/use-is-resharing-possible', () => ( {
	useIsReSharingPossible: jest.fn( () => true ),
} ) );

jest.mock( '../../../hooks/use-schedule-post', () => ( {
	useSchedulePost: jest.fn( () => ( {
		schedulePost: jest.fn(),
	} ) ),
} ) );

jest.mock( '../../../hooks/use-social-media-connections', () => ( {
	__esModule: true,
	default: jest.fn( () => ( {
		enabledConnections: [],
	} ) ),
} ) );

const setTimezone = ( abbr = '+00', offset = 0, offsetFormatted = '0', string = 'UTC' ) => {
	setSettings( {
		...getSettings(),
		timezone: {
			abbr,
			offset,
			offsetFormatted,
			string,
		},
	} );
};

describe( 'ScheduleButton', () => {
	beforeEach( () => {
		jest
			.spyOn( Date, 'now' )
			.mockImplementation( () => new Date( '2023-10-01T10:00:00Z' ).getTime() );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should render and open date picker on click', async () => {
		const user = userEvent.setup();
		setTimezone();
		render( <ScheduleButton /> );

		const scheduleButton = screen.getByRole( 'button', { name: /schedule/i } );
		await user.click( scheduleButton );

		const selectedDateButton = await screen.findByRole( 'button', {
			name: 'October 1, 2023. Selected',
		} );
		expect( selectedDateButton ).toBeInTheDocument();
	} );

	it( 'should update timestamp when a future date is selected', async () => {
		const user = userEvent.setup();
		setTimezone();
		render( <ScheduleButton /> );

		const scheduleButton = screen.getByRole( 'button', { name: /schedule/i } );
		await user.click( scheduleButton );

		const datePicker = await screen.findByRole( 'button', { name: 'October 2, 2023' } );
		await user.click( datePicker );

		const selectedDateButton = await screen.findByRole( 'button', {
			name: 'October 2, 2023. Selected',
		} );
		expect( selectedDateButton ).toBeInTheDocument();
	} );

	it( 'should display correct time in the current timezone', async () => {
		const user = userEvent.setup();
		setTimezone( '+05', 5, '5', 'Indian/Maldives' );
		render( <ScheduleButton /> );

		const scheduleButton = screen.getByRole( 'button', { name: /schedule/i } );
		await user.click( scheduleButton );

		const hoursInput = await screen.findByLabelText( 'Hours' );
		const minutesInput = await screen.findByLabelText( 'Minutes' );

		expect( hoursInput ).toBeInTheDocument();
		expect( minutesInput ).toBeInTheDocument();
	} );

	it( 'should enable confirm button when future date is selected', async () => {
		const user = userEvent.setup();
		setTimezone();
		render( <ScheduleButton /> );

		const scheduleButton = screen.getByRole( 'button', { name: /schedule/i } );
		await user.click( scheduleButton );

		const confirmButton = await screen.findByText( 'Confirm' );
		expect( confirmButton ).toBeDisabled();

		const datePicker = await screen.findByRole( 'button', { name: 'October 2, 2023' } );
		await user.click( datePicker );

		expect( confirmButton ).toBeEnabled();
	} );

	it( 'should disable past date buttons in the date picker', async () => {
		jest
			.spyOn( Date, 'now' )
			.mockImplementation( () => new Date( '2023-10-15T10:00:00Z' ).getTime() );
		const user = userEvent.setup();

		setTimezone();
		render( <ScheduleButton /> );

		const scheduleButton = screen.getByRole( 'button', { name: /schedule/i } );
		await user.click( scheduleButton );

		const pastDateButton = await screen.findByRole( 'button', { name: 'October 14, 2023' } );
		expect( pastDateButton ).toBeDisabled();
	} );
} );
