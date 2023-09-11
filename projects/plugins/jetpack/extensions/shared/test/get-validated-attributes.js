import colorValidator from '../colorValidator';
import { getValidatedAttributes } from '../get-validated-attributes';

const urlValidator = url => ! url || url.startsWith( 'http' );

const defaultAttributes = {
	boolean: {
		default: true,
		type: 'boolean',
	},
	color: {
		default: 'ffffff',
		type: 'string',
		validator: colorValidator,
	},
	language: {
		default: 'en',
		type: 'string',
		validValues: [ 'en', 'fr', 'de', 'es', 'he', 'jp' ],
	},
	url: {
		type: 'string',
		validator: urlValidator,
	},
	freeform: {
		default: 'one',
		type: 'string',
	},
};

describe( 'getValidatedAttributes', () => {
	test( 'boolean attributes', () => {
		expect( getValidatedAttributes( defaultAttributes, { boolean: true } ) ).toStrictEqual( {
			boolean: true,
		} );

		expect( getValidatedAttributes( defaultAttributes, { boolean: 'true' } ) ).toStrictEqual( {
			boolean: true,
		} );

		expect( getValidatedAttributes( defaultAttributes, { boolean: false } ) ).toStrictEqual( {
			boolean: false,
		} );

		expect( getValidatedAttributes( defaultAttributes, { boolean: 'false' } ) ).toStrictEqual( {
			boolean: false,
		} );
	} );

	test( 'attributes with a validator function', () => {
		expect( getValidatedAttributes( defaultAttributes, { color: 'ffffff' } ) ).toStrictEqual( {
			color: 'ffffff',
		} );

		expect( getValidatedAttributes( defaultAttributes, { color: 'white' } ) ).toStrictEqual( {
			color: 'ffffff',
		} );

		expect( getValidatedAttributes( defaultAttributes, { color: '000000' } ) ).toStrictEqual( {
			color: '000000',
		} );

		expect( getValidatedAttributes( defaultAttributes, { color: 'black' } ) ).toStrictEqual( {
			color: 'ffffff',
		} );
	} );

	test( 'attributes with valid values', () => {
		expect( getValidatedAttributes( defaultAttributes, { language: 'en' } ) ).toStrictEqual( {
			language: 'en',
		} );

		expect( getValidatedAttributes( defaultAttributes, { language: 'fr' } ) ).toStrictEqual( {
			language: 'fr',
		} );

		expect( getValidatedAttributes( defaultAttributes, { language: 'pt' } ) ).toStrictEqual( {
			language: 'en',
		} );
	} );

	test( 'attributes without a default values', () => {
		expect(
			getValidatedAttributes( defaultAttributes, { url: 'http://jetpack.com' } )
		).toStrictEqual( { url: 'http://jetpack.com' } );

		expect(
			getValidatedAttributes( defaultAttributes, { url: 'https://jetpack.com' } )
		).toStrictEqual( { url: 'https://jetpack.com' } );

		expect( getValidatedAttributes( defaultAttributes, { url: 'jetpack.com' } ) ).toStrictEqual( {
			url: undefined,
		} );
	} );

	test( 'attributes without validation', () => {
		expect( getValidatedAttributes( defaultAttributes, { freeform: 'one' } ) ).toStrictEqual( {
			freeform: 'one',
		} );

		expect( getValidatedAttributes( defaultAttributes, { freeform: 'two' } ) ).toStrictEqual( {
			freeform: 'two',
		} );

		expect( getValidatedAttributes( defaultAttributes, { freeform: undefined } ) ).toStrictEqual( {
			freeform: undefined,
		} );
	} );
} );
