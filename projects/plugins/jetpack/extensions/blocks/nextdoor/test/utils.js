import { parseUrl } from '../utils';

describe( 'Test parseUrl', () => {
	describe( 'invalid urls', () => {
		test( 'empty', () => {
			expect( parseUrl( '' ) ).toBeUndefined();
		} );

		test( 'random string', () => {
			expect( parseUrl( 'randomUrlLikeString' ) ).toBeUndefined();
		} );

		test( 'bad site', () => {
			expect( parseUrl( 'https://www.facebook.com/embed/PC6hdR84L-S6' ) ).toBeUndefined();
		} );
	} );
	describe( 'valid urls', () => {
		test( 'URL with https', () => {
			expect(
				parseUrl( 'https://nextdoor.com/p/PC6hdR84L-S6?utm_source=share&extras=ODc1NzI3Mjc%3D' )
			).toBe( 'https://nextdoor.com/embed/PC6hdR84L-S6' );
		} );

		test( 'URL without protocol', () => {
			expect(
				parseUrl( 'www.nextdoor.com/p/PC6hdR84L-S6?utm_source=share&extras=ODc1NzI3Mjc%3D' )
			).toBe( 'https://www.nextdoor.com/embed/PC6hdR84L-S6' );
		} );

		test( 'URL without identification', () => {
			expect(
				parseUrl( 'nextdoor.com/p/PC6hdR84L-S6?utm_source=share&extras=ODc1NzI3Mjc%3D' )
			).toBe( 'https://nextdoor.com/embed/PC6hdR84L-S6' );
		} );

		test( 'Embed format URL', () => {
			expect( parseUrl( 'https://www.nextdoor.com/embed/PC6hdR84L-S6' ) ).toBe(
				'https://www.nextdoor.com/embed/PC6hdR84L-S6'
			);
		} );

		test( 'Embed format URL without protocol', () => {
			expect( parseUrl( 'nextdoor.com/embed/PC6hdR84L-S6' ) ).toBe(
				'https://nextdoor.com/embed/PC6hdR84L-S6'
			);
		} );
	} );
} );
