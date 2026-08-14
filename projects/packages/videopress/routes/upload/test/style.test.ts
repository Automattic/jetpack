/**
 * The step-flow cross-fade is pure CSS, so there is nothing in jsdom to assert
 * against: stylesheets aren't compiled or applied in the test environment, and
 * jest stubs `.scss` imports out entirely. The rule is read from source
 * instead, because the failure it guards against is severe and invisible to
 * every other test — the exiting card printed straight through the incoming
 * one, body text over body text, at the single moment the product is judged.
 */

// `@types/node` isn't a dependency of this package — nothing in the client
// touches the filesystem — so the one Node global this needs is declared here
// instead of pulling the whole type package in. `fs` itself arrives through
// `jest.requireActual`, which is already typed.
declare const __dirname: string;

describe( 'step-flow cross-fade', () => {
	const { readFileSync } = jest.requireActual< {
		readFileSync: ( path: string, encoding: string ) => string;
	} >( 'fs' );
	const stylesheet = readFileSync( `${ __dirname }/../style.scss`, 'utf8' );

	/**
	 * Read one declaration block out of the stylesheet by its selector.
	 *
	 * @param selector - The selector text as written in the source.
	 * @return Everything between that selector's braces.
	 */
	const block = ( selector: string ): string => {
		// `${selector} {` and not just the selector: `.vp-flow__card.is-exit`
		// also appears mid-list in the reduced-motion pair, whose block belongs
		// to both.
		const start = stylesheet.indexOf( `${ selector } {` );
		expect( start ).toBeGreaterThan( -1 );
		const open = stylesheet.indexOf( '{', start );
		return stylesheet.slice( open + 1, stylesheet.indexOf( '}', open ) );
	};

	it( 'lets the exiting card keep its natural height', () => {
		const exit = block( '&.is-exit' );

		expect( exit ).toContain( 'position: absolute' );
		expect( exit ).toContain( 'inset-block-start: 0' );
		// `inset: 0` pins the bottom edge too, which stretched the exiting card
		// to the wrapper's height — by then already easing towards the INCOMING
		// step's. Going upload → edit that is the full editor, and the dropzone
		// card centres its content, so its hint and button landed in the middle
		// of the editor rather than staying at their own height near the top.
		expect( exit ).not.toMatch( /\binset:/ );
		expect( exit ).not.toContain( 'inset-block-end' );
		expect( exit ).not.toContain( 'block-size' );
	} );

	it( 'still hides the exiting card outright under reduced motion', () => {
		// The overlay can't misbehave when it isn't drawn; this branch is the
		// reason the fix above only has to be right for the animated path.
		const reducedMotion = stylesheet.slice(
			stylesheet.indexOf( '@media ( prefers-reduced-motion: reduce )' )
		);
		expect( reducedMotion.indexOf( '.vp-flow__card.is-exit' ) ).toBeGreaterThan( -1 );
		expect( reducedMotion.slice( 0, reducedMotion.indexOf( '@keyframes' ) ) ).toContain(
			'display: none'
		);
	} );
} );
