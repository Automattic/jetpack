import { toIntRewindId } from '../_helpers';

describe( 'toIntRewindId', () => {
	test( 'returns the input unchanged when there is no decimal suffix', () => {
		expect( toIntRewindId( '1777035492' ) ).toBe( '1777035492' );
	} );

	test( 'strips a single decimal suffix', () => {
		expect( toIntRewindId( '1777035492.615' ) ).toBe( '1777035492' );
	} );

	test( 'strips everything from the first dot onwards', () => {
		expect( toIntRewindId( '1777035492.615.123' ) ).toBe( '1777035492' );
	} );
} );
