/**
 * External dependencies
 */
import { createTZDateFromParts } from '@jetpack-premium-analytics/datetime';
import { render, screen } from '@testing-library/react';
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
} );
