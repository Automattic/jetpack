import { renderHook } from '@testing-library/react';
import { useChartLegendItems } from '../../../components/legend';
import { GlobalChartsProvider } from '../../../providers';
import { useGlobalChartsContext } from '../../../providers/chart-context/hooks/use-global-charts-context';
import { contrastRatio } from '../../../providers/chart-context/private/perceptual-color';
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

	test( 'lists the stacked primaries, then one static item in the comparison total color', () => {
		const { result } = renderHook(
			() => ( {
				items: useBarLegendItems( twoMetricData, { layout: 'stacked', comparisonItem: true } ),
				getBarColors: useBarColors(),
			} ),
			{ wrapper }
		);
		const colors = result.current.getBarColors( twoMetricData, { layout: 'stacked' } );

		expect( colors[ 1 ] ).toBe( colors[ 3 ] );
		expect(
			result.current.items.map( item => [ item.label, item.color, item.interactive !== false ] )
		).toEqual( [
			[ 'Views', colors[ 0 ], true ],
			[ 'Visitors', colors[ 2 ], true ],
			[ 'Comparison period', colors[ 1 ], false ],
		] );
	} );

	test.each( [
		[ 'comparisonItem unset', twoMetricData, undefined ],
		[ 'comparisonItem false', twoMetricData, false ],
		[
			'nothing to compare',
			twoMetricData.filter( series => series.options?.type !== 'comparison' ),
			true,
		],
	] )( 'lists only the stacked primaries with %s', ( _case, data, comparisonItem ) => {
		const { result } = renderHook(
			() => useBarLegendItems( data, { layout: 'stacked', comparisonItem } ),
			{ wrapper }
		);

		expect( result.current.map( item => item.label ) ).toEqual( [ 'Views', 'Visitors' ] );
	} );

	const stackedColors = ( data: SeriesData[] ) =>
		renderHook(
			() => ( {
				colors: useBarColors()( data, { layout: 'stacked' } ),
				background: useGlobalChartsContext().backgroundColor ?? '#ffffff',
			} ),
			{ wrapper }
		).result.current;

	test.each( [
		[ 'the default gray', undefined, true ],
		[ 'a themed role', '#3858e9', false ],
	] )(
		'colors every stacked comparison in the comparison role toned to 3:1, from %s',
		( _case, role, gray ) => {
			if ( role ) {
				document.documentElement.style.setProperty( '--a8c-charts-color-comparison', role );
			}
			const { colors, background } = stackedColors( twoMetricData );
			document.documentElement.style.removeProperty( '--a8c-charts-color-comparison' );
			const [ red, green, blue ] = colors[ 1 ].slice( 1 ).match( /../g ) ?? [];

			expect( colors[ 3 ] ).toBe( colors[ 1 ] );
			expect( red === green && green === blue ).toBe( gray );
			expect( contrastRatio( colors[ 1 ], background ) ).toBeGreaterThanOrEqual( 3 );
			expect( contrastRatio( colors[ 1 ], background ) ).toBeLessThan( 3.2 );
		}
	);

	test( "colors every stacked comparison in the first comparison's own stroke", () => {
		const { colors } = stackedColors(
			twoMetricData.map( series =>
				series.label === 'Visitors — previous'
					? { ...series, options: { ...series.options, stroke: '#aa3355' } }
					: series
			)
		);

		expect( [ colors[ 1 ], colors[ 3 ] ] ).toEqual( [ '#aa3355', '#aa3355' ] );
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
