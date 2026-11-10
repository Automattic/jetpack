// The jsdom stand-in for `@visx/responsive` replaces the whole module to report a parent size,
// so it has to carry the rest of it: `@visx/xychart` reads `debounce` in `TooltipProvider` and
// `AnimatedPath`, and `ParentSize` in `XYChart`. Dropping one fails only in the consumer whose
// chart happens to animate or open a tooltip, nowhere near the jest config that caused it.
//
// The stand-in reaches the real module through a second `moduleNameMapper` entry, which only
// the projects that install it have. Stand in for that entry here, where `@visx/responsive`
// is a real dependency, so the stand-in's own contract is covered in the package that owns it.
jest.mock(
	'jetpack-js-tools/jest/visx-responsive-actual',
	() => jest.requireActual( '@visx/responsive' ),
	{ virtual: true }
);

const standIn = jest.requireActual( 'jetpack-js-tools/jest/visx-responsive-stub.cjs' );

describe( 'the @visx/responsive jsdom stand-in', () => {
	it( 'reports a measured parent, which jsdom cannot', () => {
		const { width, height } = standIn.useParentSize();

		expect( width ).toBeGreaterThan( 0 );
		expect( height ).toBeGreaterThan( 0 );
	} );

	it.each( [ 'debounce', 'ParentSize', 'ScaleSVG', 'useScreenSize', 'withParentSize' ] )(
		'keeps the real %s',
		name => {
			expect( typeof standIn[ name ] ).toBe( 'function' );
		}
	);

	it( 'keeps the real debounce, not a passthrough', () => {
		const spy = jest.fn();
		standIn.debounce( spy, 50 )();

		expect( spy ).not.toHaveBeenCalled();
	} );
} );
