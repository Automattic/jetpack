import { renderHook } from '@testing-library/react';
import { useChartLegendItems } from '../../../components/legend';
import { GlobalChartsProvider } from '../../../providers';
import { useBarColors } from '../use-bar-colors';
import { useBarLegendItems } from '../use-bar-legend-items';
import type { SeriesData } from '../../../types';
import type { ReactNode } from 'react';

const wrapper = ( { children }: { children: ReactNode } ) => (
	<GlobalChartsProvider>{ children }</GlobalChartsProvider>
);

const twoMetricData: SeriesData[] = [
	{ label: 'Views', group: 'views', data: [ { label: 'Mon', value: 100 } ] },
	{
		label: 'Views — previous',
		group: 'views',
		options: { type: 'comparison' },
		data: [ { label: 'Mon', value: 90 } ],
	},
	{ label: 'Visitors', group: 'visitors', data: [ { label: 'Mon', value: 50 } ] },
	{
		label: 'Visitors — previous',
		group: 'visitors',
		options: { type: 'comparison' },
		data: [ { label: 'Mon', value: 40 } ],
	},
];
const perMetricLabel = ( metric: string ) => `${ metric } (Prev. 7 days)`;

describe( 'useBarLegendItems', () => {
	test.each( [
		[
			'takes the grouped comparison tints, a collapsed group in its comparison tint,',
			'grouped',
			[ 1, 3, 1, 3 ],
		],
		[ 'takes the opaque overlap bar colors', 'overlap', [ 0, 2, 1, 3 ] ],
	] as const )( '%s with layout %s', ( _case, layout, colorOrder ) => {
		const { result } = renderHook(
			() => ( {
				items: useBarLegendItems( twoMetricData, {
					collapseGroups: true,
					comparisonSeriesItems: perMetricLabel,
					layout,
				} ),
				getBarColors: useBarColors(),
			} ),
			{ wrapper }
		);
		const colors = result.current.getBarColors( twoMetricData, { layout } );

		expect( result.current.items.map( item => item.color ) ).toEqual(
			colorOrder.map( index => colors[ index ] )
		);
	} );

	test( 'lists one item per series in slot order, primaries first, with layout overlap', () => {
		const { result } = renderHook(
			() => useBarLegendItems( twoMetricData, { layout: 'overlap' } ),
			{ wrapper }
		);

		expect( result.current.map( item => item.label ) ).toEqual(
			[ 0, 2, 1, 3 ].map( index => twoMetricData[ index ].label )
		);
	} );

	test( "returns the chart legend's own items without a layout", () => {
		const options = { collapseGroups: true };
		const { result } = renderHook(
			() => ( {
				bar: useBarLegendItems( twoMetricData, options ),
				chart: useChartLegendItems( twoMetricData, options ),
			} ),
			{ wrapper }
		);

		expect( result.current.bar ).toEqual( result.current.chart );
	} );
} );
