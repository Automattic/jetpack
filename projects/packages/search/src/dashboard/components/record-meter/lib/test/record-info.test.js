import getRecordInfo from '../record-info';

describe( 'get record information', () => {
	test( 'a null last indexed date does not indicate that a site has not been indexed', () => {
		const recordInfo = getRecordInfo( 25, {}, null );
		expect( recordInfo.hasBeenIndexed ).toBe( true );
	} );

	test( 'a null post count does indicate that a site has not been indexed', () => {
		const recordInfo = getRecordInfo( null, {}, null );
		expect( recordInfo.hasBeenIndexed ).toBe( false );
	} );
} );
