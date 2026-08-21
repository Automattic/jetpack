/**
 * External dependencies
 */
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ComparativeLineChart } from '../comparative-line-chart';
import type { ComparativeLineChartSeries } from '../types';

const mockLineSpy = jest.fn();
const mockLegendSpy = jest.fn();

jest.mock( '@jetpack-premium-analytics/externals', () => {
	const { forwardRef } = jest.requireActual( 'react' );

	const LineChart = ( props: { children?: React.ReactNode } ) => {
		mockLineSpy( props );
		return <div data-testid="line-chart">{ props.children }</div>;
	};
	LineChart.Legend = ( props: Record< string, unknown > ) => {
		mockLegendSpy( props );
		return <div data-testid="line-chart-legend" />;
	};

	return {
		LineChart,
		LineShape: () => null,
		RectShape: () => null,
		Stack: forwardRef(
			(
				{ children }: { children?: React.ReactNode },
				ref: React.ForwardedRef< HTMLDivElement >
			) => <div ref={ ref }>{ children }</div>
		),
	};
} );

jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useResizeObserver: () => () => undefined,
} ) );

const DATA_FORMAT = { type: 'number' as const, options: { decimals: 0 } };
const JULY_1 = new Date( '2026-07-01T00:00:00Z' );
const JUNE_1 = new Date( '2026-06-01T00:00:00Z' );

const SERIES_WITH_COMPARISON: ComparativeLineChartSeries[] = [
	{
		label: 'Views',
		group: 'views',
		data: [ { date: JULY_1, value: 100 } ],
	},
	{
		label: 'Views · previous period',
		group: 'views',
		options: { type: 'comparison' },
		data: [ { date: JUNE_1, value: 80 } ],
	},
];

const PAIRED_SERIES: ComparativeLineChartSeries[] = [
	...SERIES_WITH_COMPARISON,
	{
		label: 'Visitors',
		group: 'visitors',
		data: [ { date: JULY_1, value: 40 } ],
	},
	{
		label: 'Visitors · previous period',
		group: 'visitors',
		options: { type: 'comparison' },
		data: [ { date: JUNE_1, value: 30 } ],
	},
];

type RecordedLineProps = {
	chartId?: string;
	defaultHiddenSeries?: readonly string[];
	legend: { collapseGroups: boolean; interactive: boolean };
	renderTooltip: ( params: unknown ) => {
		props: {
			getLabel: ( datum: { date: Date; realDate?: Date }, index: number, key: string ) => string;
		};
	};
};

function recordedProps(): RecordedLineProps {
	expect( mockLineSpy ).toHaveBeenCalled();
	return mockLineSpy.mock.calls.at( -1 )[ 0 ];
}

describe( 'ComparativeLineChart', () => {
	beforeEach( () => {
		mockLineSpy.mockClear();
		mockLegendSpy.mockClear();
	} );

	it( 'passes visibility settings through to the chart and legend', () => {
		render(
			<ComparativeLineChart
				chartId="traffic"
				series={ PAIRED_SERIES }
				dataFormat={ DATA_FORMAT }
				defaultHiddenSeries={ [ 'Visitors', 'Visitors · previous period' ] }
				legendInteractive
			/>
		);

		expect( recordedProps() ).toMatchObject( {
			chartId: 'traffic',
			defaultHiddenSeries: [ 'Visitors', 'Visitors · previous period' ],
			legend: { collapseGroups: true, interactive: true },
		} );
		expect( mockLegendSpy ).toHaveBeenLastCalledWith(
			expect.objectContaining( { interactive: true } )
		);
	} );

	it( 'keeps period legend items separate for a single metric', () => {
		render( <ComparativeLineChart series={ SERIES_WITH_COMPARISON } dataFormat={ DATA_FORMAT } /> );

		expect( recordedProps().legend ).toEqual( {
			collapseGroups: false,
			interactive: false,
		} );
	} );

	it( 'uses a comparison point real date even when its series name is unavailable', () => {
		render( <ComparativeLineChart series={ PAIRED_SERIES } dataFormat={ DATA_FORMAT } /> );
		/* eslint-disable-next-line testing-library/render-result-naming-convention --
		   This is the chart's renderTooltip result, not testing-library's render result. */
		const tooltip = recordedProps().renderTooltip( { tooltipData: undefined } );

		expect( tooltip.props.getLabel( { date: JULY_1, realDate: JUNE_1 }, 0, 'Unknown' ) ).toBe(
			'Unknown · June 1, 2026'
		);
	} );
} );
