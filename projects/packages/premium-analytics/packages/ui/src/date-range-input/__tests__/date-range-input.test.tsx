/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
import { createTZDateFromParts } from '@jetpack-premium-analytics/datetime';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { DateRangeInput } from '../date-range-input';

describe( 'DateRangeInput', () => {
	it( 'formats values in the same timezone used to parse them', () => {
		const timeZone = 'Asia/Taipei';

		render(
			<DateRangeInput
				range={ {
					from: createTZDateFromParts( [ 2026, 6, 9 ], timeZone ),
					to: createTZDateFromParts( [ 2026, 6, 10 ], timeZone ),
				} }
				onChange={ jest.fn() }
				timeZone={ timeZone }
			/>
		);

		expect( screen.getByLabelText( 'From' ) ).toHaveValue( '2026-07-09' );
		expect( screen.getByLabelText( 'To' ) ).toHaveValue( '2026-07-10' );
	} );

	it( 'refuses a start before the earliest day and restores the input on blur', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		render(
			<DateRangeInput
				range={ {
					from: new TZDate( 2026, 6, 12, 'UTC' ),
					to: new TZDate( 2026, 6, 14, 'UTC' ),
				} }
				onChange={ onChange }
				timeZone="UTC"
				earliestDate={ new TZDate( 2026, 6, 10, 'UTC' ) }
			/>
		);

		const from = screen.getByLabelText( 'From' );
		await user.clear( from );
		await user.type( from, '2026-07-01' );
		await user.tab();

		expect( onChange ).not.toHaveBeenCalled();
		expect( from ).toHaveValue( '2026-07-12' );
	} );
} );
