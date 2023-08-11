import analytics from '../index';

describe( 'analytics', () => {
	it( 'returns an object with methods', () => {
		expect( typeof analytics ).toBe( 'object' );
		expect( analytics.initialize ).toBeInstanceOf( Function );
	} );
} );
