/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import LineOrBarField from '../line-or-bar-field';
import type { DataFormControlProps } from '@jetpack-premium-analytics/externals';

type ChartAttributes = { chartType?: string };

// The attribute as a widget declares it: the type name and no `elements`.
const field = {
	id: 'chartType',
	label: 'Chart type',
	getValue: ( { item }: { item: ChartAttributes } ) => item.chartType,
	setValue: ( { value }: { value: unknown } ) => ( { chartType: value } ),
	isDisabled: () => false,
} as unknown as DataFormControlProps< ChartAttributes >[ 'field' ];

describe( 'LineOrBarField', () => {
	it( 'offers line and bar on an attribute that carries no options, and writes the pick', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();

		render(
			<LineOrBarField data={ { chartType: 'line' } } field={ field } onChange={ onChange } />
		);
		// Drain ariakit's post-mount microtasks. See also https://github.com/testing-library/react-testing-library/pull/1214
		// eslint-disable-next-line testing-library/no-unnecessary-act -- No user action to wrap; this settles internal ariakit state
		await act( async () => {} );

		expect( screen.getByRole( 'radio', { name: 'Line chart' } ) ).toBeChecked();

		await user.click( screen.getByRole( 'radio', { name: 'Bar chart' } ) );

		expect( onChange ).toHaveBeenCalledWith( { chartType: 'bar' } );
	} );
} );
