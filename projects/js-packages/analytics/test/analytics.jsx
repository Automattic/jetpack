import { expect } from 'chai';
import analytics from '../index';

describe( 'analytics', () => {
	it( 'returns an object with methods', () => {
		expect( typeof analytics ).to.equal( 'object' );
		expect( analytics ).to.respondTo( 'initialize' );
	} );
} );
