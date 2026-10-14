import { renderHook } from '@testing-library/react';
import { useChartLegendItems } from '../../../components/legend';
import { GlobalChartsProvider } from '../../../providers';
import { applyBarOverlapLegend } from '../apply-bar-overlap-legend';
import { useBarOverlapStyles } from '../use-bar-overlap-styles';
import type { BarOverlapStyles } from '../types';

const styles: BarOverlapStyles = {
	outer: { label: 'Views', fill: '#c9d4f9', outline: '#3858e9' },
	inner: { label: 'Visitors', fill: '#3858e9' },
	comparisons: [
		{
			label: 'Views prev',
			primaryLabel: 'Views',
			stroke: 'var(--a8c-charts-color-comparison-line, #1e1e1e)',
			lineStyles: { strokeDasharray: '4 4' },
			marker: 'square',
		},
	],
};

const makePoints = ( values: number[] ) =>
	values.map( ( value, index ) => ( { date: new Date( Date.UTC( 2024, 0, 1 + index ) ), value } ) );

const options = { stroke: '#3858e9' };
const comparison = { type: 'comparison' as const };
const views = { label: 'Views', group: 'views', options, data: makePoints( [ 300, 200 ] ) };
const visitors = { label: 'Visitors', group: 'visitors', options, data: makePoints( [ 120, 90 ] ) };
const viewsPrev = {
	label: 'Views prev',
	group: 'views',
	options: comparison,
	data: makePoints( [ 280, 210 ] ),
};
const visitorsPrev = {
	label: 'Visitors prev',
	group: 'visitors',
	options: comparison,
	data: makePoints( [ 110, 95 ] ),
};

describe( 'applyBarOverlapLegend', () => {
	it( 'gives the outer item its tint and outline and the comparison item a line glyph', () => {
		const [ outer, , comparisonItem ] = applyBarOverlapLegend(
			[
				{ label: 'Views', color: '#3858e9', seriesLabels: [ 'Views', 'Views prev' ] },
				{ label: 'Visitors', color: '#3858e9', seriesLabels: [ 'Visitors' ] },
				{
					label: 'Views (Previous period)',
					color: '#3858e9',
					describesSeries: 'Views prev',
				},
			],
			styles
		);
		expect( outer ).toMatchObject( {
			color: '#c9d4f9',
			shapeStyle: { border: '1px solid #3858e9' },
		} );
		expect( comparisonItem.renderGlyph ).toEqual( expect.any( Function ) );
	} );

	it( 'leaves the items alone outside the overlap layout', () => {
		const items = [ { label: 'Views', color: '#3858e9' } ];
		expect( applyBarOverlapLegend( items, null ) ).toBe( items );
	} );

	it( 'finds the outer and comparison items in real legend output', () => {
		const data = [ views, visitors, viewsPrev, visitorsPrev ];
		const { result } = renderHook(
			() => {
				const items = useChartLegendItems( data, {
					collapseGroups: true,
					comparisonSeriesItems: ( metric: string ) => `${ metric } (Previous period)`,
				} );
				const overlapStyles = useBarOverlapStyles( data, { layout: 'overlap' } );
				return applyBarOverlapLegend( items, overlapStyles );
			},
			{ wrapper: GlobalChartsProvider }
		);

		expect( result.current.map( item => item.label ) ).toEqual( [
			'Views',
			'Visitors',
			'Views (Previous period)',
			'Visitors (Previous period)',
		] );
		expect( result.current[ 0 ].shapeStyle ).toMatchObject( { boxSizing: 'border-box' } );
		expect( result.current[ 2 ].renderGlyph ).toEqual( expect.any( Function ) );
		expect( result.current[ 3 ].renderGlyph ).toEqual( expect.any( Function ) );
	} );
} );
