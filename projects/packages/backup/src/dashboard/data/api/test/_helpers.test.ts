import { ApiError, requireTypes, toIntRewindId } from '../_helpers';

describe( 'toIntRewindId', () => {
	test( 'returns the input unchanged when there is no decimal suffix', () => {
		expect( toIntRewindId( '1777035492' ) ).toBe( '1777035492' );
	} );

	test( 'strips a single decimal suffix', () => {
		expect( toIntRewindId( '1777035492.615' ) ).toBe( '1777035492' );
	} );

	test( 'strips everything from the first dot onwards', () => {
		expect( toIntRewindId( '1777035492.615.123' ) ).toBe( '1777035492' );
	} );
} );

describe( 'requireTypes', () => {
	test( 'emits the object form, keeping only the selected categories', () => {
		expect( requireTypes( { themes: true, plugins: false, sqls: true } ) ).toEqual( {
			themes: true,
			sqls: true,
		} );
	} );

	// Half the reason this helper exists. WPCOM selects the enabled
	// categories with a loose comparison, so a JSON array of names yields
	// its own integer indices — `[ "themes" ]` becomes `[ 0 ]` — and
	// those get treated as category names. An emptiness check would never
	// catch it, because the list is not empty.
	test( 'never produces an array', () => {
		const result = requireTypes( { themes: true, plugins: true } );

		expect( Array.isArray( result ) ).toBe( false );
		expect( result ).toEqual( { themes: true, plugins: true } );
	} );

	// The other half. Omitting `types` is not "ask for nothing" — WPCOM
	// reads an absent `types` as all six categories, so an unticked
	// checklist submitted a *full* download, and a full destructive
	// restore. Refusing is the only safe reading of an empty selection,
	// and it has to happen below the UI: the screens disable their
	// buttons, but the danger is in the request, not the button.
	test( 'refuses an empty selection rather than letting the key be omitted', () => {
		expect( () => requireTypes( { themes: false, plugins: false } ) ).toThrow( ApiError );
		expect( () => requireTypes( {} ) ).toThrow( ApiError );
	} );

	test( 'throws a branchable code', () => {
		// Captured rather than asserted inside the `catch`, which
		// `jest/no-conditional-expect` rejects: an assertion that only runs
		// when the throw happens passes silently when it does not.
		let thrown: unknown;
		try {
			requireTypes( {} );
		} catch ( error ) {
			thrown = error;
		}

		expect( thrown ).toBeInstanceOf( ApiError );
		expect( ( thrown as ApiError ).code ).toBe( 'no_types_selected' );
	} );
} );
