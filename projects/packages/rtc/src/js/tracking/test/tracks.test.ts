import { getTransport } from '../tracks';

describe( 'getTransport', () => {
	afterEach( () => {
		delete ( window as Record< string, unknown > ).jetpackRTC;
	} );

	it( 'returns "pinghub" when the pinghub provider is configured', () => {
		( window as Record< string, unknown > ).jetpackRTC = { providers: [ 'pinghub' ] };
		expect( getTransport() ).toBe( 'pinghub' );
	} );

	it( 'returns "http-polling" when pinghub is not in the providers list', () => {
		( window as Record< string, unknown > ).jetpackRTC = { providers: [ 'http-polling' ] };
		expect( getTransport() ).toBe( 'http-polling' );
	} );

	it( 'returns "http-polling" when jetpackRTC is absent', () => {
		expect( getTransport() ).toBe( 'http-polling' );
	} );
} );
