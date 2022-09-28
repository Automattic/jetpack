import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BusinessHours, { defaultLocalization } from '../edit';

const isWeekend = day => [ 'Sun', 'Sat' ].includes( day.substring( 0, 3 ) );

const dayStrings = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ];
const dayStringsShort = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
const defaultDays = dayStringsShort.map( day => {
	const hours = isWeekend( day ) ? [] : [ { opening: '09:00', closing: '17:00' } ];
	return {
		name: day,
		hours,
	};
} );

describe( 'Business Hours', () => {
	const defaultAttributes = {
		days: defaultDays,
	};

	const setAttributes = jest.fn();
	const defaultProps = {
		attributes: defaultAttributes,
		setAttributes,
		clientId: 1,
		isSelected: false,
	};

	const originalFetch = window.fetch;

	beforeEach( () => {
		setAttributes.mockClear();
		// eslint-disable-next-line jest/prefer-spy-on -- Nothing to spy on.
		window.fetch = jest.fn();
		window.fetch.mockReturnValue(
			Promise.resolve( { status: 200, json: () => Promise.resolve( defaultLocalization ) } )
		);
	} );

	afterAll( () => {
		window.fetch = originalFetch;
	} );

	test( 'renders the default business hours when not selected', async () => {
		const propsNotSelected = { ...defaultProps, isSelected: false };
		render( <BusinessHours { ...propsNotSelected } /> );

		expect( window.fetch.mock.calls[ 0 ][ 0 ] ).toBe(
			'/wpcom/v2/business-hours/localized-week?_locale=user'
		);

		// Displays loading state
		expect( screen.getByText( 'Loading business hours' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Saturday' ) ).not.toBeInTheDocument();

		// Displays default days and business hours
		await expect( screen.findByText( 'Monday' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Tuesday' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Wednesday' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Thursday' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Friday' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Saturday' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Sunday' ) ).toBeInTheDocument();
		expect( screen.getAllByText( '9: 00 am - 5: 00 pm' ) ).toHaveLength( 5 );
		expect( screen.getAllByText( 'Closed' ) ).toHaveLength( 2 );
	} );

	test.each( dayStrings )(
		'should toggle day to open / closed for %s when switching toggle',
		async dayString => {
			const user = userEvent.setup();
			const propsNotSelected = { ...defaultProps, isSelected: true };
			render( <BusinessHours { ...propsNotSelected } /> );

			let day;

			await waitFor( () => {
				day = screen.getByText( dayString );
				expect( day ).toBeInTheDocument();
			} );

			const openClosed = isWeekend( dayString ) ? 'Closed' : 'Open';

			// eslint-disable-next-line testing-library/no-node-access
			const dayRow = day.parentNode;
			await user.click( within( dayRow ).getByLabelText( openClosed ) );

			let expectVal;
			if ( 'Open' === openClosed ) {
				expectVal = { hours: [], name: dayString.substring( 0, 3 ) };
			} else {
				expectVal = {
					hours: [ { closing: '17:00', opening: '09:00' } ],
					name: dayString.substring( 0, 3 ),
				};
			}
			expect( setAttributes.mock.calls[ 0 ][ 0 ].days[ dayStrings.indexOf( dayString ) ] ).toEqual(
				expectVal
			);
		}
	);

	test( 'should change opening hours when updating input', async () => {
		const user = userEvent.setup();
		const propsNotSelected = { ...defaultProps, isSelected: true };
		render( <BusinessHours { ...propsNotSelected } /> );

		await expect( screen.findByText( 'Monday' ) ).resolves.toBeInTheDocument();

		// The behavior of <input type="time"> with user-event is kind of weird. Ctrl-A to select the contents before typing seems to work.
		await user.type( screen.getAllByLabelText( 'Opening' )[ 0 ], '{Control>}a{/Control}6:00' );

		expect( setAttributes.mock.calls[ 0 ][ 0 ].days[ 1 ] ).toEqual( {
			hours: [ { closing: '17:00', opening: '06:00' } ],
			name: 'Mon',
		} );
	} );

	test( 'should change closing hours when updating input', async () => {
		const user = userEvent.setup();
		const propsSelected = { ...defaultProps, isSelected: true };
		render( <BusinessHours { ...propsSelected } /> );

		await expect( screen.findByText( 'Monday' ) ).resolves.toBeInTheDocument();

		// The behavior of <input type="time"> with user-event is kind of weird. Ctrl-A to select the contents before typing seems to work.
		await user.type( screen.getAllByLabelText( 'Closing' )[ 0 ], '{Control>}a{/Control}14:00' );

		expect( setAttributes.mock.calls[ 0 ][ 0 ].days[ 1 ] ).toEqual( {
			hours: [ { closing: '14:00', opening: '09:00' } ],
			name: 'Mon',
		} );
	} );

	test( 'should add an additional set of opening/closing hours', async () => {
		const user = userEvent.setup();
		const propsSelectedSingleDay = { ...defaultProps, isSelected: true };
		propsSelectedSingleDay.attributes.days = dayStringsShort.map( day => ( {
			name: day,
			hours: [],
		} ) );
		propsSelectedSingleDay.attributes.days[ 0 ].hours = [ { opening: '09:00', closing: '17:00' } ];

		const { rerender } = render( <BusinessHours { ...propsSelectedSingleDay } /> );

		await expect( screen.findByLabelText( 'Opening' ) ).resolves.toBeInTheDocument();
		expect( screen.getByLabelText( 'Closing' ) ).toBeInTheDocument();

		await user.click( screen.getByLabelText( 'Add Hours' ) );

		const newHours = [
			{ opening: '09:00', closing: '17:00' },
			{ opening: '', closing: '' },
		];
		expect( setAttributes.mock.calls[ 0 ][ 0 ].days[ 0 ] ).toEqual( {
			hours: newHours,
			name: 'Sun',
		} );

		propsSelectedSingleDay.attributes.days[ 0 ].hours = newHours;

		rerender( <BusinessHours { ...propsSelectedSingleDay } /> );

		await waitFor( () => expect( screen.getAllByLabelText( 'Opening' ) ).toHaveLength( 2 ) );
		expect( screen.getAllByLabelText( 'Closing' ) ).toHaveLength( 2 );
	} );

	test( 'should remove an additional set of opening/closing hours', async () => {
		const user = userEvent.setup();
		const propsSelectedSingleDay = { ...defaultProps, isSelected: true };
		propsSelectedSingleDay.attributes.days = dayStringsShort.map( day => ( {
			name: day,
			hours: [],
		} ) );
		propsSelectedSingleDay.attributes.days[ 0 ].hours = [
			{ opening: '09:00', closing: '17:00' },
			{ opening: '18:00', closing: '20:00' },
		];

		const { rerender } = render( <BusinessHours { ...propsSelectedSingleDay } /> );

		await waitFor( () => expect( screen.getAllByLabelText( 'Opening' ) ).toHaveLength( 2 ) );
		expect( screen.getAllByLabelText( 'Closing' ) ).toHaveLength( 2 );

		await user.click( screen.getAllByLabelText( 'Remove Hours' )[ 1 ] );

		const newHours = [ { opening: '09:00', closing: '17:00' } ];
		expect( setAttributes.mock.calls[ 0 ][ 0 ].days[ 0 ] ).toEqual( {
			hours: newHours,
			name: 'Sun',
		} );

		propsSelectedSingleDay.attributes.days[ 0 ].hours = newHours;

		rerender( <BusinessHours { ...propsSelectedSingleDay } /> );

		await expect( screen.findByLabelText( 'Opening' ) ).resolves.toBeInTheDocument();
		expect( screen.getByLabelText( 'Closing' ) ).toBeInTheDocument();
	} );
} );
