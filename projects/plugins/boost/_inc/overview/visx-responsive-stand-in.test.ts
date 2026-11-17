// Here, not in the charts package, because this is about the mapper reaching that package's
// copy. Resolved through jest because Boost does not depend on the module, so TypeScript has
// nothing to type an import against; `requireActual` goes through the mapper, where
// `requireMock` would auto-mock every export and pass this file's `typeof` assertions.
const visxResponsive: Record< string, unknown > = jest.requireActual( '@visx/responsive' );

describe( 'the @visx/responsive jsdom stand-in', () => {
	it( 'reports a measured parent, which jsdom cannot', () => {
		const { width, height } = (
			visxResponsive.useParentSize as () => { width: number; height: number }
		 )();

		expect( width ).toBeGreaterThan( 0 );
		expect( height ).toBeGreaterThan( 0 );
	} );

	it.each( [ 'debounce', 'ParentSize', 'ScaleSVG', 'useScreenSize', 'withParentSize' ] )(
		'keeps the real %s',
		name => {
			expect( typeof visxResponsive[ name ] ).toBe( 'function' );
		}
	);

	it( 'keeps a debounce that defers, not a passthrough', () => {
		const spy = jest.fn();
		( visxResponsive.debounce as ( fn: () => void, ms: number ) => () => void )( spy, 50 )();

		expect( spy ).not.toHaveBeenCalled();
	} );
} );
