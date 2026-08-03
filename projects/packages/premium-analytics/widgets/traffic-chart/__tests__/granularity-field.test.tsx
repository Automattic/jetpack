/**
 * External dependencies
 */
import { SelectField, type SelectOption } from '@jetpack-premium-analytics/fields';
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import GranularityField from '../granularity-field';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { ComponentProps } from 'react';

jest.mock( '@jetpack-premium-analytics/fields', () => ( {
	SelectField: jest.fn( () => null ),
} ) );

const mockSelectField = SelectField as unknown as jest.Mock;

const ELEMENTS: SelectOption[] = [
	{ value: 'auto', label: 'Auto' },
	{ value: 'hour', label: 'By hours' },
	{ value: 'day', label: 'By days' },
	{ value: 'week', label: 'By weeks' },
	{ value: 'month', label: 'By months' },
];

type FieldProp = ComponentProps< typeof GranularityField >[ 'field' ];

function elementsFor( reportParams: ReportParams ): SelectOption[] {
	// Without a matched route (as in Storybook), the resolver falls back to the
	// report params carried in the attributes being edited.
	render(
		<GranularityField
			data={ { granularity: 'auto', reportParams } }
			field={ { id: 'granularity', label: 'Group by', elements: ELEMENTS } as FieldProp }
			onChange={ jest.fn() }
		/>
	);

	// The router-less fallback path warns once per render; that's the path
	// under test, not a defect.
	expect( console ).toHaveWarnedWith(
		'Warning: useRouter must be used inside a <RouterProvider> component!'
	);

	return mockSelectField.mock.calls.at( -1 )[ 0 ].field.elements;
}

function disabledValues( elements: SelectOption[] ): string[] {
	return elements.filter( element => element.disabled ).map( element => String( element.value ) );
}

describe( 'GranularityField', () => {
	beforeEach( () => {
		mockSelectField.mockClear();
	} );

	it( 'disables the options the range disallows, keeping Auto untouched', () => {
		const elements = elementsFor( {
			from: '2026-07-04',
			to: '2026-08-02',
			interval: 'day',
			preset: 'last-30-days',
		} );

		expect( disabledValues( elements ) ).toEqual( [ 'hour', 'month' ] );
		expect( elements[ 0 ] ).toEqual( { value: 'auto', label: 'Auto' } );
	} );

	it( 'enables hourly on a single-day range and disables the coarse options', () => {
		const elements = elementsFor( {
			from: '2026-08-02',
			to: '2026-08-02',
			interval: 'hour',
			preset: 'today',
		} );

		expect( disabledValues( elements ) ).toEqual( [ 'week', 'month' ] );
	} );

	it( 'leaves only months selectable on a year-long range', () => {
		const elements = elementsFor( {
			from: '2025-08-03',
			to: '2026-08-02',
			interval: 'month',
			preset: 'last-12-months',
		} );

		expect( disabledValues( elements ) ).toEqual( [ 'hour', 'day', 'week' ] );
	} );
} );
