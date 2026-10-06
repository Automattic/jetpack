/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import {
	CHART_INTERVAL_ELEMENTS,
	chartIntervalField,
	type ChartIntervalFieldAttributes,
} from '../chart-interval-field';
import type { ComponentType } from 'react';

let mockSearch: Record< string, string >;

jest.mock( '@wordpress/route', () => ( { useSearch: () => mockSearch } ) );

// Long enough to allow months and years, which this widget does not list.
const MULTI_YEAR = { from: '2022-01-01T00:00:00.000Z', to: '2026-10-06T23:59:59.999Z' };

type ControlProps = {
	data: ChartIntervalFieldAttributes;
	field: { elements: typeof CHART_INTERVAL_ELEMENTS };
	onChange: ( next: ChartIntervalFieldAttributes ) => void;
};

const Control = chartIntervalField.Edit as unknown as ComponentType< ControlProps >;

const DAILY_TO_MONTHLY = CHART_INTERVAL_ELEMENTS.filter(
	( { value } ) => value !== 'hour' && value !== 'year'
);

function renderControl( data: ChartIntervalFieldAttributes = {} ) {
	const onChange = jest.fn();

	render(
		<Control data={ data } field={ { elements: DAILY_TO_MONTHLY } } onChange={ onChange } />
	);

	return { onChange };
}

beforeEach( () => {
	mockSearch = { preset: 'last-30-days' };
} );

describe( 'chartIntervalField', () => {
	it( "saves a pick on the widget's own attributes", async () => {
		const user = userEvent.setup();
		const { onChange } = renderControl();

		await user.click( screen.getByRole( 'button', { name: 'By days' } ) );
		await user.click( screen.getByRole( 'menuitemradio', { name: 'By weeks' } ) );

		expect( onChange ).toHaveBeenCalledWith( { chartInterval: 'week' } );
	} );

	it( 'offers only the buckets its widget lists', () => {
		mockSearch = MULTI_YEAR;

		renderControl();

		expect( screen.getByRole( 'button', { name: 'Chart interval: By months' } ) ).toBeDisabled();
	} );

	it( 'shows a saved bucket the range rules out as the nearest one, without rewriting it', () => {
		mockSearch = MULTI_YEAR;

		const { onChange } = renderControl( { chartInterval: 'week' } );

		expect( screen.getByRole( 'button', { name: 'Chart interval: By months' } ) ).toBeDisabled();
		expect( onChange ).not.toHaveBeenCalled();
	} );
} );
