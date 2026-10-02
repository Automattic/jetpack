/**
 * The at-limit look is pure CSS, and jsdom neither compiles nor applies
 * stylesheets (jest stubs `.scss` imports out entirely), so the rule is read
 * from source — the same technique routes/upload/test/style.test.ts uses. Worth
 * guarding because the failure is invisible to every other test: the button
 * kept answering a click correctly while rendering in full brand blue, so it
 * read as completely live at the very moment it was refusing.
 */

describe( 'at-limit dropzone styling', () => {
	const { readFileSync } = jest.requireActual< {
		readFileSync: ( path: string, encoding: string ) => string;
	} >( 'fs' );
	/**
	 * The stylesheet under test. Located from jest's own state rather than
	 * `__dirname`: `@types/node` isn't a dependency of this package (nothing in
	 * the client touches the filesystem), and a second ambient
	 * `declare const __dirname` would collide with the one in
	 * routes/upload/test/style.test.ts — both files are global scripts to
	 * TypeScript, having no imports of their own.
	 *
	 * @return The stylesheet source.
	 */
	const readStylesheet = (): string =>
		readFileSync(
			expect.getState().testPath?.replace( /test[/\\]style\.test\.ts$/, 'style.scss' ) ?? '',
			'utf8'
		);

	/**
	 * Read one declaration block out of the stylesheet by its selector.
	 *
	 * @param selector - The selector text as written in the source.
	 * @return Everything between that selector's braces.
	 */
	const block = ( selector: string ): string => {
		const stylesheet = readStylesheet();
		const start = stylesheet.indexOf( `${ selector } {` );
		expect( start ).toBeGreaterThan( -1 );
		const open = stylesheet.indexOf( '{', start );
		return stylesheet.slice( open + 1, stylesheet.indexOf( '}', open ) );
	};

	it( 'dims and refuses the picker button, matching the header buttons', () => {
		// `aria-disabled` keeps the button focusable so it can explain itself on
		// click, but the DS only dims `:disabled` — so without these two lines it
		// sat at the plan limit in full brand blue with a plain pointer, while
		// the header "Upload video" button one screen away was dimmed and
		// `not-allowed`. Two contradicting conventions for one state.
		const button = block( '&__button[aria-disabled="true"]' );

		expect( button ).toContain( 'opacity: 0.5' );
		expect( button ).toContain( 'cursor: not-allowed' );
	} );

	it( 'keeps the same refusal on the surface around it', () => {
		// The two halves of the control have to look the same way they behave.
		const surface = block( '&.is-disabled,\n\t&.is-disabled:hover' );

		expect( surface ).toContain( 'cursor: not-allowed' );
	} );
} );
