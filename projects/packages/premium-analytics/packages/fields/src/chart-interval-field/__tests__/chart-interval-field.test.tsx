/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import {
	chartIntervalElements,
	chartIntervalField,
	type ChartIntervalFieldAttributes,
} from '../chart-interval-field';
import type { ReportParamsFieldAttributes } from '../../report-params-field/report-params-field';
import type { ComponentType } from 'react';

type Attributes = ChartIntervalFieldAttributes & Partial< ReportParamsFieldAttributes >;

let mockSearch: Record< string, string >;

jest.mock( '@wordpress/route', () => ( { useSearch: () => mockSearch } ) );

const MULTI_YEAR = { from: '2022-01-01T00:00:00.000Z', to: '2026-10-06T23:59:59.999Z' };

type ControlProps = {
	data: Attributes;
	field: { elements: ReturnType< typeof chartIntervalElements > };
	onChange: ( next: Attributes ) => void;
};

const Control = chartIntervalField.Edit as unknown as ComponentType< ControlProps >;

const DAILY_TO_MONTHLY = chartIntervalElements( [ 'day', 'week', 'month' ] );

function renderControl( data: Attributes = {} ) {
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

	// The menu checks the clamped bucket, but the saved one still says months.
	it( 'saves a pick of the bucket the range clamped the saved one to', async () => {
		const user = userEvent.setup();
		const { onChange } = renderControl( { chartInterval: 'month' } );

		await user.click( screen.getByRole( 'button', { name: 'By weeks' } ) );
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

	it( "reads a widget's own range before the page's", () => {
		renderControl( { reportParams: MULTI_YEAR } as Attributes );

		expect( screen.getByRole( 'button', { name: 'Chart interval: By months' } ) ).toBeDisabled();
	} );
} );
