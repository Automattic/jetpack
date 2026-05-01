import { createElement } from 'react';
import { renderLegendSlot } from '../render-legend-slot';
import type { LegendChild } from '../use-chart-children';

const makeLegend = ( position: 'top' | 'bottom', label: string ): LegendChild => ( {
	element: createElement( 'div', null, label ),
	position,
} );

describe( 'renderLegendSlot', () => {
	it( 'should return an empty array when given no children', () => {
		expect( renderLegendSlot( [], 'top' ) ).toHaveLength( 0 );
	} );

	it( 'should return an empty array when no children match the position', () => {
		const children = [ makeLegend( 'bottom', 'Legend 1' ) ];

		expect( renderLegendSlot( children, 'top' ) ).toHaveLength( 0 );
	} );

	it( 'should return a single matching child', () => {
		const children = [ makeLegend( 'top', 'Legend 1' ) ];
		const view = renderLegendSlot( children, 'top' );

		expect( view ).toHaveLength( 1 );
		expect( view[ 0 ] ).toHaveProperty( 'key', 'legend-top-0' );
	} );

	it( 'should return multiple matching children in order', () => {
		const children = [ makeLegend( 'bottom', 'Legend 1' ), makeLegend( 'bottom', 'Legend 2' ) ];
		const view = renderLegendSlot( children, 'bottom' );

		expect( view ).toHaveLength( 2 );
		expect( view[ 0 ] ).toHaveProperty( 'key', 'legend-bottom-0' );
		expect( view[ 1 ] ).toHaveProperty( 'key', 'legend-bottom-1' );
	} );

	it( 'should filter out children with a different position', () => {
		const children = [
			makeLegend( 'top', 'Top Legend' ),
			makeLegend( 'bottom', 'Bottom Legend' ),
			makeLegend( 'top', 'Another Top Legend' ),
		];

		expect( renderLegendSlot( children, 'top' ) ).toHaveLength( 2 );
		expect( renderLegendSlot( children, 'bottom' ) ).toHaveLength( 1 );
	} );

	it( 'should produce distinct keys for top and bottom slots', () => {
		const children = [ makeLegend( 'top', 'Top' ), makeLegend( 'bottom', 'Bottom' ) ];
		const [ topElement, bottomElement ] = [
			renderLegendSlot( children, 'top' )[ 0 ],
			renderLegendSlot( children, 'bottom' )[ 0 ],
		];

		expect( topElement ).toHaveProperty( 'key', 'legend-top-0' );
		expect( bottomElement ).toHaveProperty( 'key', 'legend-bottom-0' );
		expect( topElement ).not.toEqual( bottomElement );
	} );
} );
