import { createCopyRequestId } from '../create-copy-request-id';

afterEach( () => jest.restoreAllMocks() );

it.each( [
	[ 0x00, '00000000-0000-4000-8000-000000000000' ],
	[ 0xff, 'ffffffff-ffff-4fff-bfff-ffffffffffff' ],
] )( 'sets UUIDv4 version and variant bits for random bytes %i', ( byte, expected ) => {
	const random = jest.spyOn( crypto, 'getRandomValues' ).mockImplementation( array => {
		( array as Uint8Array ).fill( byte as number );
		return array;
	} );
	expect( createCopyRequestId() ).toBe( expected );
	expect( random ).toHaveBeenCalledTimes( 1 );
	expect( random ).toHaveBeenCalledWith( expect.any( Uint8Array ) );
	expect( random.mock.calls[ 0 ][ 0 ]?.byteLength ).toBe( 16 );
} );

it( 'preserves the remaining random bytes in their original order', () => {
	jest.spyOn( crypto, 'getRandomValues' ).mockImplementation( array => {
		( array as Uint8Array ).set( Array.from( { length: 16 }, ( _, index ) => index ) );
		return array;
	} );
	expect( createCopyRequestId() ).toBe( '00010203-0405-4607-8809-0a0b0c0d0e0f' );
} );
