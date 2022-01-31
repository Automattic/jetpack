/**
 * Internal dependencies
 */
import { pinType } from '../utils';

describe( 'utils', () => {
	describe( 'pinType', () => {
		test( 'should return empty string for invalid urls', () => {
			expect( pinType() ).toEqual( '' );
			expect( pinType( '' ) ).toEqual( '' );
			expect( pinType( 'https://jetpack.com' ) ).toEqual( '' );
			expect( pinType( 'https://pinterest.com' ) ).toEqual( '' );
			expect( pinType( 'https://bananas.rule.net/pin/4524524543' ) ).toEqual( '' );
		} );

		test( 'should return `embedPin` for pin urls', () => {
			expect( pinType() ).toEqual( '' );
			expect( pinType( 'https://www.pinterest.com.au/pin/766667536554271154/' ) ).toEqual( 'embedPin' );
			expect( pinType( 'https://pinterest.com/pin/766667536554271154' ) ).toEqual( 'embedPin' );
			expect( pinType( 'https://pinterest.de/pin/766667536554271154/' ) ).toEqual( 'embedPin' );
			expect( pinType( 'http://pinterest.com/pin/766667536554271154/' ) ).toEqual( 'embedPin' );
		} );

		test( 'should return `embedUser` for user urls', () => {
			expect( pinType() ).toEqual( '' );
			expect( pinType( 'https://www.pinterest.com.au/jeanette1952/' ) ).toEqual( 'embedUser' );
			expect( pinType( 'https://pinterest.com/jeanette1952' ) ).toEqual( 'embedUser' );
			expect( pinType( 'https://pinterest.fr/jeanette1952' ) ).toEqual( 'embedUser' );
		} );

		test( 'should return `embedBoard` for board urls', () => {
			expect( pinType() ).toEqual( '' );
			expect( pinType( 'https://www.pinterest.com.au/pinchofyum/pasta-recipes/' ) ).toEqual( 'embedBoard' );
			expect( pinType( 'https://pinterest.com/pinchofyum/pasta-recipes/' ) ).toEqual( 'embedBoard' );
			expect( pinType( 'https://pinterest.fr/pinchofyum/pasta-recipes/' ) ).toEqual( 'embedBoard' );
		} );
	} );
} );
