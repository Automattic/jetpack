/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { BarChart } from '../bar-chart';
import type { ComponentProps, ReactNode } from 'react';

jest.mock( '@jetpack-premium-analytics/externals', () => {
	const barChartBase = Object.assign(
		jest.fn( () => null ),
		{ Legend: () => null }
	);
	return {
		BarChart: barChartBase,
		Icon: () => null,
		EmptyState: () => null,
		LineShape: () => null,
		RectShape: () => null,
		Stack: ( { children }: { children?: ReactNode } ) => <div>{ children }</div>,
	};
} );

const barChartBaseMock = jest.requireMock( '@jetpack-premium-analytics/externals' )
	.BarChart as jest.Mock;

type BarChartBaseProps = {
	options: { axis?: { x?: Record< string, unknown > } };
	renderTooltip: ( params: {
		tooltipData: { datumByKey: Record< string, unknown > };
	} ) => ReactNode;
};

const timeSeriesData = [
	{
		label: 'Views',
		data: [
			{ date: new Date( Date.UTC( 2026, 6, 27 ) ), value: 120 },
			{ date: new Date( Date.UTC( 2026, 6, 28 ) ), value: 95 },
		],
	},
] as ComponentProps< typeof BarChart >[ 'chartData' ];

const renderBarChart = ( props: Partial< ComponentProps< typeof BarChart > > = {} ) => {
	render(
		<BarChart chartData={ timeSeriesData } dataFormat={ { type: 'number' } } { ...props } />
	);
	return barChartBaseMock.mock.calls.at( -1 )[ 0 ] as BarChartBaseProps;
};

beforeEach( () => {
	barChartBaseMock.mockClear();
} );

describe( 'BarChart tick formatting', () => {
	it( 'omits the axis tickFormat key entirely when the prop is unset', () => {
		const { options } = renderBarChart();

		expect( 'tickFormat' in ( options.axis?.x ?? {} ) ).toBe( false );
	} );

	it( 'formats date ticks with the named site format when tickFormat is set', () => {
		const { options } = renderBarChart( { tickFormat: 'short' } );
		const tickFormat = options.axis?.x?.tickFormat as ( value: unknown ) => string;

		expect( tickFormat( new Date( Date.UTC( 2026, 6, 27 ) ) ) ).toBe( 'July 27' );
	} );

	it( 'passes string tick values through untouched', () => {
		const { options } = renderBarChart( { tickFormat: 'short' } );
		const tickFormat = options.axis?.x?.tickFormat as ( value: unknown ) => string;

		expect( tickFormat( 'summer' ) ).toBe( 'summer' );
	} );
} );

describe( 'BarChart tooltip labels', () => {
	it( 'formats date-only datums with the full site date format', () => {
		const { renderTooltip } = renderBarChart( { tickFormat: 'short' } );

		render(
			<>
				{ renderTooltip( {
					tooltipData: {
						datumByKey: {
							Views: {
								key: 'Views',
								index: 0,
								datum: { date: new Date( Date.UTC( 2026, 6, 27 ) ), value: 120 },
							},
						},
					},
				} ) }
			</>
		);

		expect( screen.getByText( 'July 27, 2026' ) ).toBeInTheDocument();
	} );

	it( 'keeps the series key for labeled categorical datums', () => {
		const { renderTooltip } = renderBarChart();

		render(
			<>
				{ renderTooltip( {
					tooltipData: {
						datumByKey: {
							'Dec 16, 2025-Jan 14, 2026': {
								key: 'Dec 16, 2025-Jan 14, 2026',
								index: 0,
								datum: { label: 'summer', value: 4500 },
							},
						},
					},
				} ) }
			</>
		);

		expect( screen.getByText( 'Dec 16, 2025-Jan 14, 2026' ) ).toBeInTheDocument();
	} );
} );
