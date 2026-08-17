import {
	THEME_LAYERED_ROLES,
	themeLayerVar,
	themeOverrideVars,
} from '../private/theme-override-vars';

describe( 'themeOverrideVars', () => {
	it( 'returns nothing for an absent theme', () => {
		expect( themeOverrideVars( undefined ) ).toEqual( { vars: {}, roles: [] } );
	} );

	it( 'returns nothing for a theme that overrides no mapped role', () => {
		expect( themeOverrideVars( { tickLength: 8 } ) ).toEqual( { vars: {}, roles: [] } );
	} );

	// The value is published one layer outside the role — `chart-scope.scss` declares the role as `var(<role>-theme, <catalog default>)`. Published as the role itself, a value that is invalid at computed-value time (`var(--wpds-token)` with the token unset) would make the role invalid too, and every bare `var(--a8c-charts-color-grid)` read site would paint `unset` instead of falling back to the catalog default.
	it( 'maps a grid stroke override onto the grid role’s theme layer', () => {
		expect( themeOverrideVars( { gridStyles: { stroke: 'red' } } ) ).toEqual( {
			vars: { '--a8c-charts-color-grid-theme': 'red' },
			roles: [ '--a8c-charts-color-grid' ],
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
			vars: {
				'--a8c-charts-color-background-theme': '#111',
				'--a8c-charts-color-grid-theme': '#222',
				'--a8c-charts-color-axis-theme': '#333',
				'--a8c-charts-color-tick-theme': '#444',
				'--a8c-charts-color-label-axis-theme': '#555',
			},
			roles: [
				'--a8c-charts-color-background',
				'--a8c-charts-color-grid',
				'--a8c-charts-color-axis',
				'--a8c-charts-color-tick',
				'--a8c-charts-color-label-axis',
			],
		} );
	} );

	it( 'publishes only theme-layer variables, never a catalog role directly', () => {
		const { vars } = themeOverrideVars( {
			backgroundColor: '#111',
			gridStyles: { stroke: '#222' },
			xAxisLineStyles: { stroke: '#333' },
			xTickLineStyles: { stroke: '#444' },
			svgLabelSmall: { fill: '#555' },
		} );

		expect( Object.keys( vars ) ).toEqual( THEME_LAYERED_ROLES.map( themeLayerVar ) );
	} );

	// The narrow role is the whole point: the broad `--a8c-charts-color-label` is also read by legend labels, heatmap cell values, funnel labels and the line-chart tooltip, none of which `svgLabelSmall.fill` moved before the role was published as a custom property.
	it( 'publishes an svg label override as the narrow axis-label role, not the broad one', () => {
		expect( themeOverrideVars( { svgLabelSmall: { fill: 'red' } } ) ).toEqual( {
			vars: { '--a8c-charts-color-label-axis-theme': 'red' },
			roles: [ '--a8c-charts-color-label-axis' ],
		} );
	} );

	it( 'ignores a value that is itself a pointer at the role it would override', () => {
		expect(
			themeOverrideVars( { gridStyles: { stroke: 'var(--a8c-charts-color-grid, #dbdbdb)' } } ).vars
		).toEqual( {} );
	} );

	// A skipped value still reports its role, so `withCatalogPointers` restores the theme field. Without that, CSS would paint the catalog default while visx painted the consumer's literal — the divergence this whole mechanism exists to remove.
	it( 'still reports the role of a value it refuses to publish', () => {
		expect(
			themeOverrideVars( {
				gridStyles: { stroke: 'var(--brand, var(--a8c-charts-color-grid, red))' },
			} )
		).toEqual( { vars: {}, roles: [ '--a8c-charts-color-grid' ] } );
	} );

	// `var()` allows whitespace after the opening paren. The role reads its theme layer, so a value naming the role closes a cycle through the catalog entry: CSS marks every custom property in a cycle invalid at computed-value time, and the role's own fallback is not used, so the token resolves to nothing at all.
	it.each( [
		'var( --a8c-charts-color-grid, #dbdbdb )',
		'var(\t--a8c-charts-color-grid, #dbdbdb)',
		'var(\n--a8c-charts-color-grid, #dbdbdb)',
	] )( 'ignores a self-referential pointer written as %j', stroke => {
		expect( themeOverrideVars( { gridStyles: { stroke } } ).vars ).toEqual( {} );
	} );

	it( 'still emits a value that merely mentions a different role', () => {
		expect(
			themeOverrideVars( { gridStyles: { stroke: 'var( --a8c-charts-color-axis, #dbdbdb )' } } )
				.vars
		).toEqual( {
			'--a8c-charts-color-grid-theme': 'var( --a8c-charts-color-axis, #dbdbdb )',
		} );
	} );

	// A mapped role can be a strict prefix of another custom property — a catalog role such as `--a8c-charts-color-label` of `--a8c-charts-color-label-axis`, the role's own theme layer, or a name the consumer defined themselves. A prefix match would read a legitimate cross-property pointer as a self-reference and silently drop the override, so the role must be followed by something that cannot continue an identifier.
	it( 'does not mistake a longer property name for the role it guards', () => {
		expect(
			themeOverrideVars( {
				xAxisLineStyles: { stroke: 'var(--a8c-charts-color-axis-emphasis, #000)' },
			} ).vars
		).toEqual( { '--a8c-charts-color-axis-theme': 'var(--a8c-charts-color-axis-emphasis, #000)' } );
	} );

	// `resolveCssVariable` also accepts a bare custom-property name with no `var()` wrapper, so `theme={ { gridStyles: { stroke: '--a8c-charts-color-grid' } } }` is legal input. It forms no cycle, so it must be caught explicitly or it survives as a literal string value and drops silently at the use site.
	it( 'ignores a self-referential pointer written as a bare custom-property name', () => {
		expect(
			themeOverrideVars( { gridStyles: { stroke: '--a8c-charts-color-grid' } } ).vars
		).toEqual( {} );
	} );
} );
