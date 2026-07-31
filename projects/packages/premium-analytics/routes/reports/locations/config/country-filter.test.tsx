/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { LocationsCountryFilter } from './country-filter';
import type { LocationsCountryOption } from './use-report-records';

const countries: LocationsCountryOption[] = [
	{ code: 'AU', label: 'Australia' },
	{ code: 'DE', label: 'Germany' },
];

describe( 'LocationsCountryFilter', () => {
	it( 'lists the unscoped option first, then the countries in the given order', () => {
		render(
			<LocationsCountryFilter
				countries={ countries }
				value=""
				allLabel="All regions"
				onChange={ jest.fn() }
			/>
		);

		expect(
			screen
				.getAllByRole( 'option' )
				.map( option => [ ( option as HTMLOptionElement ).value, option.textContent ] )
		).toEqual( [
			[ '', 'All regions' ],
			[ 'AU', 'Australia' ],
			[ 'DE', 'Germany' ],
		] );
	} );

	it( 'reports the picked country code', async () => {
		const onChange = jest.fn();
		render(
			<LocationsCountryFilter
				countries={ countries }
				value=""
				allLabel="All regions"
				onChange={ onChange }
			/>
		);

		await userEvent
			.setup()
			.selectOptions( screen.getByRole( 'combobox', { name: 'Filter by country' } ), 'AU' );

		// SelectControl also passes the change event, which the filter's own
		// contract does not carry, so assert on the country code alone.
		expect( onChange.mock.calls[ 0 ][ 0 ] ).toBe( 'AU' );
	} );
} );
