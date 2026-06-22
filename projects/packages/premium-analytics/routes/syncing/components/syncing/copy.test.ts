/**
 * Internal dependencies
 */
import { describeSync } from './copy';

describe( 'describeSync', () => {
	it( 'uses store-data copy by default (hasStoreData = true)', () => {
		const { title, description } = describeSync( { hasError: false, hasStoreData: true } );

		expect( title ).toBe( "We're preparing your data" );
		expect( description ).toContain( 'store data' );
	} );

	it( 'drops "store" for storeless sites (hasStoreData = false)', () => {
		const { description } = describeSync( { hasError: false, hasStoreData: false } );

		expect( description ).toContain( 'site data' );
		expect( description ).not.toContain( 'store' );
	} );

	it( 'shows the interrupted title with store error copy on error', () => {
		const { title, description } = describeSync( { hasError: true, hasStoreData: true } );

		expect( title ).toBe( 'Sync interrupted' );
		expect( description ).toContain( 'store data' );
	} );

	it( 'uses site error copy for storeless sites on error', () => {
		const { title, description } = describeSync( { hasError: true, hasStoreData: false } );

		expect( title ).toBe( 'Sync interrupted' );
		expect( description ).toContain( 'site data' );
		expect( description ).not.toContain( 'store' );
	} );
} );
