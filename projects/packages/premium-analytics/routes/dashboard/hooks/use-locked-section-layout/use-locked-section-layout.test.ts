/**
 * External dependencies
 */
import { getLockedSection } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useLockedSectionLayout } from './use-locked-section-layout';
import type { LockedSectionGate } from '@jetpack-premium-analytics/data';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	getLockedSection: jest.fn(),
} ) );

const OPEN_TYPE = 'jpa/traffic-chart';

const widget = ( uuid: string, type = 'jpa/referrers', attributes = {} ) =>
	( { uuid, type, attributes, placement: { width: 1, height: 1 } } ) as DashboardWidget;

// Traffic as saved: the chart first, then eleven widgets a free plan locks.
const trafficLayout = [
	widget( 'chart', OPEN_TYPE, { chartType: 'bar' } ),
	...Array.from( { length: 11 }, ( _, index ) => widget( `locked-${ index }` ) ),
];

const gate = { open_widget_types: [ OPEN_TYPE ] } as LockedSectionGate;

describe( 'useLockedSectionLayout', () => {
	beforeEach( () => {
		jest
			.mocked( getLockedSection )
			.mockImplementation( section => ( section === 'traffic' ? gate : undefined ) );
	} );

	it( 'keeps every hidden widget, in place, when an inline edit saves the visible ones', () => {
		const onLayoutChange = jest.fn();
		const { result } = renderHook( () =>
			useLockedSectionLayout( 'traffic', trafficLayout, onLayoutChange )
		);

		expect( result.current.visibleLayout.map( item => item.uuid ) ).toEqual( [ 'chart' ] );

		result.current.onVisibleLayoutChange( [ widget( 'chart', OPEN_TYPE, { chartType: 'line' } ) ] );

		expect( onLayoutChange ).toHaveBeenCalledTimes( 1 );
		const saved = onLayoutChange.mock.calls[ 0 ][ 0 ] as DashboardWidget[];
		expect( saved.map( item => item.uuid ) ).toEqual( trafficLayout.map( item => item.uuid ) );
		expect( saved[ 0 ].attributes ).toEqual( { chartType: 'line' } );
		expect( saved.slice( 1 ) ).toEqual( trafficLayout.slice( 1 ) );
	} );

	it( 'keeps a move between open widgets, around the hidden ones', () => {
		const layout = [ widget( 'a', OPEN_TYPE ), widget( 'hidden' ), widget( 'b', OPEN_TYPE ) ];
		const onLayoutChange = jest.fn();
		const { result } = renderHook( () =>
			useLockedSectionLayout( 'traffic', layout, onLayoutChange )
		);

		result.current.onVisibleLayoutChange( [ layout[ 2 ], layout[ 0 ] ] );

		expect( onLayoutChange.mock.calls[ 0 ][ 0 ].map( item => item.uuid ) ).toEqual( [
			'b',
			'hidden',
			'a',
		] );
	} );

	it( 'hides a type the section does not keep open, such as one no longer registered', () => {
		const layout = [ widget( 'chart', OPEN_TYPE ), widget( 'ghost', 'jpa/videopress' ) ];

		const { result } = renderHook( () => useLockedSectionLayout( 'traffic', layout, jest.fn() ) );

		expect( result.current.visibleLayout.map( item => item.uuid ) ).toEqual( [ 'chart' ] );
	} );

	it( 'shows nothing on a section whose every widget is locked', () => {
		const insights = [ widget( 'a' ), widget( 'b' ) ];
		jest
			.mocked( getLockedSection )
			.mockReturnValue( { open_widget_types: [] } as unknown as LockedSectionGate );

		const { result } = renderHook( () =>
			useLockedSectionLayout( 'insights', insights, jest.fn() )
		);

		expect( result.current.visibleLayout ).toEqual( [] );
	} );

	it( 'passes an open section through untouched', () => {
		const onLayoutChange = jest.fn();
		const next = [ widget( 'x' ) ];
		const { result } = renderHook( () =>
			useLockedSectionLayout( 'subscribers', trafficLayout, onLayoutChange )
		);

		expect( result.current.lockedSection ).toBeUndefined();
		expect( result.current.isHiddenWidget ).toBeUndefined();
		expect( result.current.visibleLayout ).toBe( trafficLayout );

		result.current.onVisibleLayoutChange( next );
		expect( onLayoutChange ).toHaveBeenCalledWith( next );
	} );
} );
