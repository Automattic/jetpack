/**
 * External dependencies
 */
import { ReportScopeProvider } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import {
	chartIntervalAttributeField,
	chartIntervalElements,
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

const Control = chartIntervalAttributeField().Edit as unknown as ComponentType< ControlProps >;

const DAILY_TO_MONTHLY = chartIntervalElements( [ 'day', 'week', 'month' ] );

const HINT = 'Switch to the line chart to see each day.';

type LineOrBar = Attributes & { chartType?: 'line' | 'bar' };

const DaysOnLinesControl = chartIntervalAttributeField< LineOrBar >( ( _range, item ) =>
	item.chartType === 'line'
		? { extra: [ 'day' ] }
		: { unavailable: { intervals: [ 'day' ], hint: HINT } }
).Edit as unknown as ComponentType< Omit< ControlProps, 'data' > & { data: LineOrBar } >;

function renderDaysOnLinesControl( data: LineOrBar ) {
	const onChange = jest.fn();

	render(
		<DaysOnLinesControl
			data={ data }
			field={ { elements: DAILY_TO_MONTHLY } }
			onChange={ onChange }
		/>
	);

	return { onChange };
}

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

describe( 'chartIntervalAttributeField with no extension', () => {
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

		expect( screen.getByRole( 'button', { name: 'Chart interval: By months' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'shows a saved bucket the range rules out as the nearest one, without rewriting it', () => {
		mockSearch = MULTI_YEAR;

		const { onChange } = renderControl( { chartInterval: 'week' } );

		expect( screen.getByRole( 'button', { name: 'Chart interval: By months' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'shows a saved bucket the plan locks as the nearest open one, and lists it locked', async () => {
		const user = userEvent.setup();
		const intervalUpsell = {
			description: 'Group your charts by week.',
			supportUrl: '',
			upgradeUrl: 'https://example.com/plans',
		};
		render(
			<ReportScopeProvider
				dateLimits={ { lockedPresetIds: [], lockedIntervals: [ 'week' ], intervalUpsell } }
			>
				<Control
					data={ { chartInterval: 'week' } }
					field={ { elements: DAILY_TO_MONTHLY } }
					onChange={ jest.fn() }
				/>
			</ReportScopeProvider>
		);

		await user.click( screen.getByRole( 'button', { name: 'By days' } ) );

		expect( screen.getByRole( 'menuitemradio', { name: 'By days' } ) ).toBeChecked();
		expect( screen.getByRole( 'menuitemradio', { name: 'By weeks' } ) ).toHaveAccessibleDescription(
			intervalUpsell.description
		);
	} );

	it( "reads a widget's own range before the page's", () => {
		renderControl( { reportParams: MULTI_YEAR } as Attributes );

		expect( screen.getByRole( 'button', { name: 'Chart interval: By months' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );
} );

describe( 'chartIntervalAttributeField', () => {
	it( 'lets a widget add a bucket its range does not offer', async () => {
		const user = userEvent.setup();
		mockSearch = { preset: 'last-90-days' };
		const { onChange } = renderDaysOnLinesControl( { chartType: 'line' } );

		await user.click( screen.getByRole( 'button', { name: 'By weeks' } ) );
		await user.click( screen.getByRole( 'menuitemradio', { name: 'By days' } ) );

		expect( onChange ).toHaveBeenCalledWith( { chartInterval: 'day' } );
	} );

	it( 'shows a saved bucket the widget withholds as the range default, without rewriting it', async () => {
		const user = userEvent.setup();
		mockSearch = { preset: 'last-12-months' };
		const { onChange } = renderDaysOnLinesControl( { chartType: 'bar', chartInterval: 'day' } );

		await user.click( screen.getByRole( 'button', { name: 'By months' } ) );

		const days = screen.getByRole( 'menuitemradio', { name: 'By days' } );
		expect( days ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( days ).toHaveAccessibleDescription( HINT );
		expect( onChange ).not.toHaveBeenCalled();
	} );
} );
