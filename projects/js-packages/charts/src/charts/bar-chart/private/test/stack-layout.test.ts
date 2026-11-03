import { getStackLayout, getStackedValueDomain } from '../stack-layout';
import type { DataPointDate, SeriesData } from '../../../../types';

const s = (
	label: string,
	values: Array< number | null >,
	days = [ 'Mon', 'Tue' ]
): SeriesData => ( {
	label,
	data: values.map( ( value, index ) => ( { label: days[ index ], value } ) ),
} );

const at = ( label: string ): DataPointDate => ( { label, value: 0 } );

const SERIES = [
	s( 'Desktop', [ 100, 50 ] ),
	s( 'Mobile', [ 60, null ] ),
	s( 'Tablet', [ 20, 10 ] ),
];

describe( 'getStackLayout', () => {
	it( 'runs each series from the top of the series before it at the same category', () => {
		const { segmentOf } = getStackLayout( SERIES );
		expect( [ 'Desktop', 'Mobile', 'Tablet' ].map( key => segmentOf( key, at( 'Mon' ) ) ) ).toEqual(
			[
				{ start: 0, end: 100 },
				{ start: 100, end: 160 },
				{ start: 160, end: 180 },
			]
		);
	} );

	it( 'gives a missing reading no segment and stacks past it', () => {
		const { segmentOf } = getStackLayout( SERIES );
		expect( segmentOf( 'Mobile', at( 'Tue' ) ) ).toBeUndefined();
		expect( segmentOf( 'Tablet', at( 'Tue' ) ) ).toEqual( { start: 50, end: 60 } );
	} );

	it( 'stacks negatives downward apart from positives', () => {
		const layout = getStackLayout( [
			s( 'A', [ 10 ] ),
			s( 'B', [ -5 ] ),
			s( 'C', [ -3 ] ),
			s( 'D', [ 4 ] ),
		] );
		expect( layout.segmentOf( 'C', at( 'Mon' ) ) ).toEqual( { start: -5, end: -8 } );
		expect( layout.segmentOf( 'D', at( 'Mon' ) ) ).toEqual( { start: 10, end: 14 } );
		expect( layout.extentAt( at( 'Mon' ) ) ).toEqual( [ -8, 14 ] );
	} );

	it( 'matches dated points by time', () => {
		const dated = ( label: string, value: number ): SeriesData => ( {
			label,
			data: [ { date: new Date( 2026, 4, 13 ), value } ],
		} );
		const { segmentOf } = getStackLayout( [ dated( 'A', 30 ), dated( 'B', 12 ) ] );
		expect( segmentOf( 'B', { date: new Date( 2026, 4, 13 ), value: 12 } ) ).toEqual( {
			start: 30,
			end: 42,
		} );
	} );

	it( 'spans the widest category, or nothing without a reading', () => {
		expect( getStackLayout( SERIES ).extent ).toEqual( [ 0, 180 ] );
		expect( getStackLayout( [ s( 'A', [ null ] ) ] ).extent ).toBeNull();
	} );
} );

describe( 'getStackedValueDomain', () => {
	const all = () => true;

	it( 'leaves hidden series out', () => {
		const data: SeriesData[] = [ s( 'A', [ 10 ] ), s( 'Hidden', [ 99 ] ) ];
		expect( getStackedValueDomain( data, series => series.label !== 'Hidden' ) ).toEqual( [
			0, 10,
		] );
	} );

	it( 'reads 0 to 1 with nothing to stack', () => {
		expect( getStackedValueDomain( [ s( 'A', [ null ] ) ], all ) ).toEqual( [ 0, 1 ] );
		expect( getStackedValueDomain( [ s( 'A', [ 0 ] ) ], all ) ).toEqual( [ 0, 1 ] );
	} );
} );
