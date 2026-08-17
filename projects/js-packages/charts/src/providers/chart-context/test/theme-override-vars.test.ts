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

	// `var()` allows whitespace after the opening paren. Emitting a self-referential
	// declaration makes it invalid at computed-value time, so the token resolves to
	// nothing at all and every chart silently loses that colour.
	it.each( [
		'var( --a8c-charts-color-grid, #dbdbdb )',
		'var(\t--a8c-charts-color-grid, #dbdbdb)',
		'var(\n--a8c-charts-color-grid, #dbdbdb)',
	] )( 'ignores a self-referential pointer written as %j', stroke => {
		expect( themeOverrideVars( { gridStyles: { stroke } } ) ).toEqual( {} );
	} );

	it( 'still emits a value that merely mentions a different role', () => {
		expect(
			themeOverrideVars( { gridStyles: { stroke: 'var( --a8c-charts-color-axis, #dbdbdb )' } } )
		).toEqual( { '--a8c-charts-color-grid': 'var( --a8c-charts-color-axis, #dbdbdb )' } );
	} );

	// `--a8c-charts-color-label` is a prefix of the real role
	// `--a8c-charts-color-label-secondary`, so a prefix match would treat a legitimate
	// cross-role pointer as a self-reference and silently drop the override.
	it( 'does not mistake a longer role name for the one it guards', () => {
		expect(
			themeOverrideVars( {
				svgLabelSmall: { fill: 'var(--a8c-charts-color-label-secondary, #707070)' },
			} )
		).toEqual( { '--a8c-charts-color-label': 'var(--a8c-charts-color-label-secondary, #707070)' } );
	} );
} );
