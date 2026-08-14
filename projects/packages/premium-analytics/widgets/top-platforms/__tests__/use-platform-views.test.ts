/**
 * Internal dependencies
 */
import { isPlatformDimension } from '../use-platform-views';

describe( 'isPlatformDimension', () => {
	// The three properties `stats/devices/{property}` accepts. Anything else is
	// rejected upstream with a 400, so it must never reach the request.
	it.each( [ 'screensize', 'browser', 'platform' ] )( 'accepts %s', dimension => {
		expect( isPlatformDimension( dimension ) ).toBe( true );
	} );

	it.each( [ 'client_type', 'toString', 'constructor', '' ] )( 'rejects %s', dimension => {
		expect( isPlatformDimension( dimension ) ).toBe( false );
	} );
} );
