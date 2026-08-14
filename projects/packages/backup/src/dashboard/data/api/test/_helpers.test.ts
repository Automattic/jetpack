import { serializeTypes, toIntRewindId } from '../_helpers';

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

describe( 'serializeTypes', () => {
	test( 'emits the object form, keeping only the selected categories', () => {
		expect( serializeTypes( { themes: true, plugins: false, sqls: true } ) ).toEqual( {
			themes: true,
			sqls: true,
		} );
	} );

	// The whole reason this helper exists. WPCOM parses `types` with
	// `array_keys( $param, true )`, which compares loosely — so a JSON
	// array of names yields its integer indices (`[ "themes" ]` becomes
	// `[ 0 ]`) and forwards those to VaultPress as if they were type
	// names. An emptiness check would never catch it.
	test( 'never produces an array', () => {
		const result = serializeTypes( { themes: true, plugins: true } );

		expect( Array.isArray( result ) ).toBe( false );
		expect( result ).toEqual( { themes: true, plugins: true } );
	} );

	test( 'returns undefined when nothing is selected, so the key can be omitted', () => {
		// `{}` is not a safe stand-in: the restore route rejects a `types`
		// value that names nothing, and the download side would build an
		// archive containing nothing.
		expect( serializeTypes( { themes: false, plugins: false } ) ).toBeUndefined();
		expect( serializeTypes( {} ) ).toBeUndefined();
	} );
} );
