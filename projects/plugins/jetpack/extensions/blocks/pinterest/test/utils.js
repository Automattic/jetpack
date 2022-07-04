import { pinType } from '../utils';

describe( 'utils', () => {
	describe( 'pinType', () => {
		test( 'should return empty string for invalid urls', () => {
			expect( pinType() ).toBe( '' );
			expect( pinType( '' ) ).toBe( '' );
			expect( pinType( 'https://jetpack.com' ) ).toBe( '' );
			expect( pinType( 'https://pinterest.com' ) ).toBe( '' );
			expect( pinType( 'https://bananas.rule.net/pin/4524524543' ) ).toBe( '' );
		} );

		test( 'should return `embedPin` for pin urls', () => {
			expect( pinType() ).toBe( '' );
			expect( pinType( 'https://www.pinterest.com.au/pin/766667536554271154/' ) ).toBe(
				'embedPin'
			);
			expect( pinType( 'https://pinterest.com/pin/766667536554271154' ) ).toBe( 'embedPin' );
			expect( pinType( 'https://pinterest.de/pin/766667536554271154/' ) ).toBe( 'embedPin' );
			expect( pinType( 'http://pinterest.com/pin/766667536554271154/' ) ).toBe( 'embedPin' );
		} );

		test( 'should return `embedUser` for user urls', () => {
			expect( pinType() ).toBe( '' );
			expect( pinType( 'https://www.pinterest.com.au/jeanette1952/' ) ).toBe( 'embedUser' );
			expect( pinType( 'https://pinterest.com/jeanette1952' ) ).toBe( 'embedUser' );
			expect( pinType( 'https://pinterest.fr/jeanette1952' ) ).toBe( 'embedUser' );
		} );

		test( 'should return `embedBoard` for board urls', () => {
			expect( pinType() ).toBe( '' );
			expect( pinType( 'https://www.pinterest.com.au/pinchofyum/pasta-recipes/' ) ).toBe(
				'embedBoard'
			);
			expect( pinType( 'https://pinterest.com/pinchofyum/pasta-recipes/' ) ).toBe( 'embedBoard' );
			expect( pinType( 'https://pinterest.fr/pinchofyum/pasta-recipes/' ) ).toBe( 'embedBoard' );
		} );
	} );
} );
