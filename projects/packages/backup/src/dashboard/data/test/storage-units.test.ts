import { formatStorageSize, GIGABYTE, MEGABYTE, TERABYTE } from '../storage-units';

describe( 'formatStorageSize', () => {
	afterEach( () => {
		delete ( window as { wp?: unknown } ).wp;
	} );

	it.each( [
		[ 512 * MEGABYTE, '512MB' ],
		[ 12.4 * GIGABYTE, '12.4GB' ],
		[ 1.5 * TERABYTE, '1.5TB' ],
	] )( 'formats %d bytes as %s', ( bytes, expected ) => {
		expect( formatStorageSize( bytes ) ).toBe( expected );
	} );

	it( 'uses the locale decimal separator', () => {
		( window as { wp?: unknown } ).wp = {
			date: { getSettings: () => ( { l10n: { locale: 'de_DE' } } ) },
		};

		expect( formatStorageSize( 12.4 * GIGABYTE ) ).toBe( '12,4GB' );
	} );
} );
