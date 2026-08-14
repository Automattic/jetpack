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

	it( 'sequences the shape-changing handover so the two cards never co-occupy', () => {
		// Round 2 stopped the exiting card STRETCHING to the incoming height. What
		// round 3's tester still saw is the cross-fade itself: for ~250ms the
		// dropzone's hint and sub-copy print over the editor's Description field,
		// because a cross-fade has nothing to fade BETWEEN when the two layouts
		// share no line. So the exit finishes before the entrance begins.
		const exitDuration = stylesheet.match( /\$vp-flow-exit-duration:\s*(\d+)ms/ );
		const totalDuration = stylesheet.match( /\$vp-flow-duration:\s*(\d+)ms/ );
		expect( exitDuration ).not.toBeNull();
		expect( totalDuration ).not.toBeNull();
		const exitMs = Number( exitDuration?.[ 1 ] );
		const totalMs = Number( totalDuration?.[ 1 ] );
		expect( exitMs ).toBeGreaterThan( 0 );
		expect( exitMs ).toBeLessThan( totalMs );

		const sequenced = stylesheet.slice(
			stylesheet.indexOf( '&.is-sequenced {' ),
			stylesheet.indexOf( '@keyframes vp-card-in' )
		);
		// The exiting card is given the shorter run…
		expect( sequenced ).toMatch(
			/> \.vp-flow__card\.is-exit \{[^}]*animation-duration:\s*\$vp-flow-exit-duration/
		);
		// …and the incoming one waits exactly that long before it starts, which is
		// what makes the two disjoint rather than merely faster.
		expect( sequenced ).toMatch(
			/> \.vp-flow__card\.is-enter \{[^}]*animation-delay:\s*\$vp-flow-exit-duration/
		);
		// Inside the same total, so the wrapper's `height` transition still lands
		// with the incoming card instead of ending 120ms early.
		expect( sequenced ).toContain( '$vp-flow-duration - $vp-flow-exit-duration' );
	} );

	it( 'leaves the same-shape cross-fade alone', () => {
		// The other four steps are the same card in sequence, where the
		// cross-fade reads as one card morphing. Their rule must keep the full
		// duration and no delay — the sequencing is scoped to `.is-sequenced`.
		const enter = block( '&.is-enter' );
		expect( enter ).toContain( 'animation: vp-card-in $vp-flow-duration' );
		expect( enter ).not.toContain( 'animation-delay' );

		const exit = block( '&.is-exit' );
		expect( exit ).toContain( 'animation: vp-card-out $vp-flow-duration' );
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
