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
			'--a8c-charts-color-label-axis': '#555',
		} );
	} );

	// The narrow role is the whole point: the broad `--a8c-charts-color-label` is also read by legend labels, heatmap cell values, funnel labels and the line-chart tooltip, none of which `svgLabelSmall.fill` moved before the role was published as a custom property.
	it( 'publishes an svg label override as the narrow axis-label role, not the broad one', () => {
		expect( themeOverrideVars( { svgLabelSmall: { fill: 'red' } } ) ).toEqual( {
			'--a8c-charts-color-label-axis': 'red',
		} );
	} );

	it( 'ignores a value that is itself a pointer at the role it would define', () => {
		expect(
			themeOverrideVars( { gridStyles: { stroke: 'var(--a8c-charts-color-grid, #dbdbdb)' } } )
		).toEqual( {} );
	} );

	// `var()` allows whitespace after the opening paren. Emitting a self-referential declaration makes it invalid at computed-value time, so the token resolves to nothing at all and every chart silently loses that colour.
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

	// A mapped role can be a strict prefix of another custom property — a catalog role such as `--a8c-charts-color-label` of `--a8c-charts-color-label-axis`, or a name the consumer defined themselves. A prefix match would read a legitimate cross-property pointer as a self-reference and silently drop the override, so the role must be followed by something that cannot continue an identifier.
	it( 'does not mistake a longer property name for the role it guards', () => {
		expect(
			themeOverrideVars( {
				xAxisLineStyles: { stroke: 'var(--a8c-charts-color-axis-emphasis, #000)' },
			} )
		).toEqual( { '--a8c-charts-color-axis': 'var(--a8c-charts-color-axis-emphasis, #000)' } );
	} );

	// `resolveCssVariable` also accepts a bare custom-property name with no `var()` wrapper, so `theme={ { gridStyles: { stroke: '--a8c-charts-color-grid' } } }` is legal input. Unlike the `var()` form this is not invalid at computed-value time, so it must be caught explicitly or it survives as a literal string value.
	it( 'ignores a self-referential pointer written as a bare custom-property name', () => {
		expect( themeOverrideVars( { gridStyles: { stroke: '--a8c-charts-color-grid' } } ) ).toEqual(
			{}
		);
	} );
} );
