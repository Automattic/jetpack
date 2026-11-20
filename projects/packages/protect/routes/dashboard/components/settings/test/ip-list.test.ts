import { splitIps } from '../ip-list';

describe( 'splitIps', () => {
	it( 'splits on every separator the firewall accepts', () => {
		expect( splitIps( '203.0.113.7;203.0.113.8, 203.0.113.9\n203.0.113.10' ) ).toHaveLength( 4 );
	} );
} );
