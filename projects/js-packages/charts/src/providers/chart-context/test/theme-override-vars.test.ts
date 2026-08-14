import { themeOverrideVars } from '../private/theme-override-vars';

describe( 'themeOverrideVars', () => {
	it( 'returns nothing for an absent theme', () => {
		expect( themeOverrideVars( undefined ) ).toEqual( {} );
	} );

	it( 'returns nothing for a theme that overrides no mapped role', () => {
		expect( themeOverrideVars( { tickLength: 8 } ) ).toEqual( {} );
	} );

	it( 'maps a grid stroke override onto the grid role', () => {
		expect( themeOverrideVars( { gridStyles: { stroke: 'red' } } ) ).toEqual( {
			'--a8c-charts-color-grid': 'red',
		} );
	} );

	it( 'maps every supported role at once', () => {
		expect(
			themeOverrideVars( {
				backgroundColor: '#111',
				gridStyles: { stroke: '#222' },
				xAxisLineStyles: { stroke: '#333' },
				xTickLineStyles: { stroke: '#444' },
				svgLabelSmall: { fill: '#555' },
			} )
		).toEqual( {
			'--a8c-charts-color-background': '#111',
			'--a8c-charts-color-grid': '#222',
			'--a8c-charts-color-axis': '#333',
			'--a8c-charts-color-tick': '#444',
			'--a8c-charts-color-label': '#555',
		} );
	} );

	it( 'ignores a value that is itself a pointer at the role it would define', () => {
		expect(
			themeOverrideVars( { gridStyles: { stroke: 'var(--a8c-charts-color-grid, #dbdbdb)' } } )
		).toEqual( {} );
	} );
} );
