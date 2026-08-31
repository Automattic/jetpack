import {
	isBenignError,
	isBenignErrorType,
	getProvidersWithRealErrors,
	getInlinedProviders,
	isAllInlined,
	isFatalError,
} from './critical-css-errors';
import type {
	CriticalCssState,
	Provider,
	CriticalCssErrorDetails,
} from './stores/critical-css-state-types';

function err(
	type: CriticalCssErrorDetails[ 'type' ],
	url = 'https://example.com/'
): CriticalCssErrorDetails {
	return { url, message: `${ type } message`, type, meta: {} };
}

function provider( overrides: Partial< Provider > = {} ): Provider {
	return {
		key: 'core_front_page',
		label: 'Front Page',
		urls: [ 'https://example.com/' ],
		success_ratio: 1,
		status: 'success',
		...overrides,
	};
}

function state(
	providers: Provider[],
	status: CriticalCssState[ 'status' ] = 'generated'
): CriticalCssState {
	return { providers, status };
}

const inlined = ( key: string ) =>
	provider( { key, status: 'error', errors: [ err( 'EmptyCSSError' ) ] } );
const realError = ( key: string ) =>
	provider( { key, status: 'error', errors: [ err( 'HttpError' ) ] } );
const success = ( key: string ) => provider( { key, status: 'success' } );

describe( 'benign error classification', () => {
	test( 'isBenignError / isBenignErrorType recognise EmptyCSSError only', () => {
		expect( isBenignError( err( 'EmptyCSSError' ) ) ).toBe( true );
		expect( isBenignError( err( 'HttpError' ) ) ).toBe( false );
		expect( isBenignErrorType( 'EmptyCSSError' ) ).toBe( true );
		expect( isBenignErrorType( 'UnknownError' ) ).toBe( false );
	} );

	test( 'getInlinedProviders returns only providers whose errors are all benign', () => {
		const s = state( [ inlined( 'a' ), realError( 'b' ), success( 'c' ) ] );
		expect( getInlinedProviders( s ).map( p => p.key ) ).toEqual( [ 'a' ] );
	} );

	test( 'a provider with mixed benign + real errors is not inlined-only', () => {
		const mixed = provider( {
			key: 'm',
			status: 'error',
			errors: [ err( 'EmptyCSSError' ), err( 'HttpError' ) ],
		} );
		expect( getInlinedProviders( state( [ mixed ] ) ) ).toEqual( [] );
		expect( getProvidersWithRealErrors( state( [ mixed ] ) ).map( p => p.key ) ).toEqual( [ 'm' ] );
	} );

	test( 'getProvidersWithRealErrors ignores benign-only providers', () => {
		const s = state( [ inlined( 'a' ), realError( 'b' ) ] );
		expect( getProvidersWithRealErrors( s ).map( p => p.key ) ).toEqual( [ 'b' ] );
	} );
} );

describe( 'isAllInlined', () => {
	test( 'true when every provider is inlined-only and none succeeded', () => {
		expect( isAllInlined( state( [ inlined( 'a' ), inlined( 'b' ) ] ) ) ).toBe( true );
	} );
	test( 'false when any provider succeeded', () => {
		expect( isAllInlined( state( [ inlined( 'a' ), success( 'b' ) ] ) ) ).toBe( false );
	} );
	test( 'false when a real error is present', () => {
		expect( isAllInlined( state( [ inlined( 'a' ), realError( 'b' ) ] ) ) ).toBe( false );
	} );
	test( 'false unless status is generated', () => {
		expect( isAllInlined( state( [ inlined( 'a' ) ], 'pending' ) ) ).toBe( false );
	} );
	test( 'false when there are no providers', () => {
		expect( isAllInlined( state( [] ) ) ).toBe( false );
	} );
} );

describe( 'isFatalError with benign errors', () => {
	test( 'all-inlined is NOT fatal (regression target for BOOST-466)', () => {
		expect( isFatalError( state( [ inlined( 'a' ), inlined( 'b' ) ] ) ) ).toBe( false );
	} );
	test( 'real error with no successes IS fatal', () => {
		expect( isFatalError( state( [ realError( 'a' ) ] ) ) ).toBe( true );
	} );
	test( 'mix of benign + real with no successes IS fatal', () => {
		expect( isFatalError( state( [ inlined( 'a' ), realError( 'b' ) ] ) ) ).toBe( true );
	} );
	test( 'one success alongside inlined is not fatal', () => {
		expect( isFatalError( state( [ success( 'a' ), inlined( 'b' ) ] ) ) ).toBe( false );
	} );
	test( "server status 'error' is always fatal", () => {
		expect( isFatalError( state( [ success( 'a' ) ], 'error' ) ) ).toBe( true );
	} );
	test( "'not_generated' is never fatal", () => {
		expect( isFatalError( state( [ inlined( 'a' ) ], 'not_generated' ) ) ).toBe( false );
	} );
} );
