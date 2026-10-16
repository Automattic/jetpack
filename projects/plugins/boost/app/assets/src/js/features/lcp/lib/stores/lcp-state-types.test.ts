import { LcpStateSchema } from './lcp-state-types';

/**
 * Regression coverage for BOOST-604: an LCP state with a valid analysis was silently
 * discarded because one fragile error `meta` shape collapsed the whole client parse to the
 * not_analyzed fallback. See the `.catch()` placement and meta tolerance in lcp-state-types.ts.
 */
describe( 'LcpStateSchema', () => {
	const analyzedState = ( pages: unknown[] ) => ( {
		status: 'analyzed',
		created: 1,
		updated: 2,
		pages,
	} );

	const okPage = ( key: string ) => ( {
		key,
		url: `https://example.com/${ key }`,
		status: 'success',
	} );

	it( 'keeps nine good results when one page carries a page-navigated error with empty meta', () => {
		// The exact live repro: boost-cloud emits `{ type: 'page-navigated', meta: { finalUrl } }`,
		// the server strips the unknown key and stores `meta` as an empty PHP array, and it reaches
		// the client JSON-encoded as `[]`.
		const state = analyzedState( [
			...Array.from( { length: 9 }, ( _v, i ) => okPage( `page-${ i }` ) ),
			{
				key: 'home',
				url: 'https://example.com/',
				status: 'error',
				errors: [ { type: 'page-navigated', meta: [] } ],
			},
		] );

		const result = LcpStateSchema.parse( state );

		// Before the fix this collapsed to `{ pages: [], status: 'not_analyzed' }`.
		expect( result.status ).toBe( 'analyzed' );
		expect( result.pages ).toHaveLength( 10 );

		const homePage = result.pages.find( page => page.key === 'home' );
		expect( homePage?.status ).toBe( 'error' );
		expect( homePage?.errors ).toHaveLength( 1 );
		// The error survives intact; the empty `[]` meta normalizes to an empty object.
		expect( homePage?.errors?.[ 0 ].type ).toBe( 'page-navigated' );
		expect( homePage?.errors?.[ 0 ].meta ).toEqual( {} );
	} );

	it( 'preserves finalUrl on a page-navigated error meta', () => {
		const state = analyzedState( [
			{
				key: 'home',
				url: 'https://example.com/',
				status: 'error',
				errors: [ { type: 'page-navigated', meta: { finalUrl: 'https://example.com/landing/' } } ],
			},
		] );

		const result = LcpStateSchema.parse( state );

		expect( result.pages[ 0 ].errors?.[ 0 ].meta ).toEqual( {
			finalUrl: 'https://example.com/landing/',
		} );
	} );

	it.each( [
		[ 'empty array', [] ],
		[ 'null', null ],
		[ 'empty object', {} ],
	] )( 'accepts %s as an empty meta', ( _label, meta ) => {
		const state = analyzedState( [
			{
				key: 'home',
				url: 'https://example.com/',
				status: 'error',
				errors: [ { type: 'unknown', meta } ],
			},
		] );

		const result = LcpStateSchema.parse( state );

		expect( result.status ).toBe( 'analyzed' );
		expect( result.pages[ 0 ].errors?.[ 0 ].meta ).toEqual( {} );
	} );

	it( 'preserves the error type when a non-empty meta is malformed', () => {
		const state = analyzedState( [
			{
				key: 'home',
				url: 'https://example.com/',
				status: 'error',
				// `code` must be a number; a malformed non-empty meta degrades to `{}` but must not
				// drag the whole error down to the generic `unknown` type (the reason `meta.catch({})`
				// replaced the previous outer preprocess).
				errors: [ { type: 'http-error', meta: { code: 'not-a-number' } } ],
			},
		] );

		const result = LcpStateSchema.parse( state );

		const error = result.pages[ 0 ].errors?.[ 0 ];
		expect( error?.type ).toBe( 'http-error' );
		expect( error?.meta ).toEqual( {} );
	} );

	it( 'isolates a malformed error entry instead of failing its page', () => {
		const state = analyzedState( [
			okPage( 'good' ),
			{
				key: 'bad-error',
				url: 'https://example.com/bad-error',
				status: 'error',
				// `null` cannot be an error object; the error-level `.catch()` degrades it.
				errors: [ null ],
			},
		] );

		const result = LcpStateSchema.parse( state );

		expect( result.pages ).toHaveLength( 2 );
		// The page keeps its real identity; only the bad error degrades to the full `unknown`
		// fallback (both `type` and `meta`, matching the schema's inferred output contract).
		const badPage = result.pages.find( page => page.key === 'bad-error' );
		expect( badPage?.url ).toBe( 'https://example.com/bad-error' );
		expect( badPage?.errors?.[ 0 ] ).toEqual( { type: 'unknown', meta: {} } );
	} );

	it( 'normalizes an error object with no meta key to an empty meta', () => {
		// Dropping `.optional()` on `meta` means an absent key must still resolve to `{}` via
		// `.catch({})` rather than staying undefined; guards that behavior against a future zod change.
		const state = analyzedState( [
			{
				key: 'home',
				url: 'https://example.com/',
				status: 'error',
				errors: [ { type: 'unknown' } ],
			},
		] );

		const result = LcpStateSchema.parse( state );

		expect( result.pages[ 0 ].errors?.[ 0 ].meta ).toEqual( {} );
	} );

	it( 'isolates a malformed page instead of collapsing the array', () => {
		const state = analyzedState( [ okPage( 'a' ), null, okPage( 'b' ) ] );

		const result = LcpStateSchema.parse( state );

		expect( result.status ).toBe( 'analyzed' );
		expect( result.pages ).toHaveLength( 3 );
		expect( result.pages[ 0 ].key ).toBe( 'a' );
		expect( result.pages[ 2 ].key ).toBe( 'b' );
	} );

	it( 'degrades a non-object top-level state to the not_analyzed fallback instead of throwing', () => {
		// The disabled-module optimize response is `{ success: false, state: [] }`; the action
		// schema parses `state` through LcpStateSchema before the `success: false` handler runs, so
		// `[]` (a non-object top-level shape) must degrade rather than throw a ZodError.
		expect( LcpStateSchema.parse( [] ) ).toEqual( {
			pages: [],
			status: 'not_analyzed',
			created: 0,
			updated: 0,
		} );
	} );

	it( 'degrades an invalid top-level status in place without wiping valid pages', () => {
		const result = LcpStateSchema.parse( {
			status: 'bogus',
			pages: [ okPage( 'a' ), okPage( 'b' ) ],
		} );

		// The status field catches to `not_analyzed`; the two valid pages survive rather than being
		// collapsed to an empty array by the outer `.catch()`.
		expect( result.status ).toBe( 'not_analyzed' );
		expect( result.pages ).toHaveLength( 2 );
	} );

	it( 'parses a normal analyzed state unchanged', () => {
		const state = analyzedState( [ okPage( 'a' ), okPage( 'b' ) ] );

		const result = LcpStateSchema.parse( state );

		expect( result.status ).toBe( 'analyzed' );
		expect( result.pages ).toHaveLength( 2 );
		expect( result.pages.every( page => page.status === 'success' ) ).toBe( true );
	} );
} );
