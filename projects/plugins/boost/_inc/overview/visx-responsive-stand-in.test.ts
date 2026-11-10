// eslint-disable-next-line import/no-unresolved -- The charts package's dependency, reaching this suite through the jest module mapper rather than Boost's own.
import * as visxResponsive from '@visx/responsive';

// The stand-in that lets a chart measure itself in jsdom replaces the whole module, so it has
// to carry the rest of it: `@visx/xychart` reads `debounce` in `TooltipProvider` and
// `AnimatedPath`, and `ParentSize` in `XYChart`. Dropping one fails only in the chart that
// happens to animate or open a tooltip, which is why it is asserted here instead.
describe( 'the @visx/responsive stand-in', () => {
	it( 'reports a measured parent', () => {
		const { width, height } = visxResponsive.useParentSize();

		expect( width ).toBeGreaterThan( 0 );
		expect( height ).toBeGreaterThan( 0 );
	} );

	it.each( [ 'debounce', 'ParentSize', 'ScaleSVG', 'useScreenSize', 'withParentSize' ] )(
		'keeps the real %s',
		name => {
			expect( visxResponsive ).toHaveProperty( name );
			expect( typeof visxResponsive[ name ] ).toBe( 'function' );
		}
	);
} );
