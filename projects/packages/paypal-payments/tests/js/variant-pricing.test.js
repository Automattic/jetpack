/**
 * Tests for variant pricing helpers.
 *
 * PayPal rejects a line item that carries `unit_amount` at both the product
 * level and the variant level, so per-option prices replace the product-level
 * price and are all-or-nothing across the group.
 *
 * @package
 */

import {
	getPrimaryDimension,
	hasVariantPricing,
	validateVariants,
} from '../../src/paypal-payment-buttons/variant-builder';

/**
 * Build a variants structure with a single primary dimension.
 *
 * @param {Array} prices - One price per option; '' or undefined means unpriced.
 * @return {object} Variants structure.
 */
function variantsWithPrices( prices ) {
	return {
		dimensions: [
			{
				name: 'Size',
				primary: true,
				options: prices.map( ( value, i ) => ( {
					label: `Option ${ i + 1 }`,
					unit_amount: { currency_code: 'USD', value },
				} ) ),
			},
		],
	};
}

describe( 'getPrimaryDimension', () => {
	it( 'returns the dimension flagged primary', () => {
		const variants = {
			dimensions: [
				{ name: 'Color', primary: false, options: [] },
				{ name: 'Size', primary: true, options: [] },
			],
		};

		expect( getPrimaryDimension( variants ).name ).toBe( 'Size' );
	} );

	it( 'returns null when nothing is primary', () => {
		expect( getPrimaryDimension( { dimensions: [ { name: 'Color' } ] } ) ).toBeNull();
		expect( getPrimaryDimension( undefined ) ).toBeNull();
	} );
} );

describe( 'hasVariantPricing', () => {
	it( 'is true when any primary option has a price', () => {
		expect( hasVariantPricing( true, variantsWithPrices( [ '10.00', '' ] ) ) ).toBe( true );
	} );

	it( 'is false when no primary option has a price', () => {
		expect( hasVariantPricing( true, variantsWithPrices( [ '', '  ' ] ) ) ).toBe( false );
	} );

	it( 'is false when variants are disabled', () => {
		expect( hasVariantPricing( false, variantsWithPrices( [ '10.00' ] ) ) ).toBe( false );
	} );

	it( 'ignores prices on non-primary dimensions', () => {
		const variants = variantsWithPrices( [ '10.00' ] );
		variants.dimensions[ 0 ].primary = false;

		expect( hasVariantPricing( true, variants ) ).toBe( false );
	} );
} );

describe( 'validateVariants', () => {
	it( 'accepts a group where every option is priced', () => {
		expect( validateVariants( true, variantsWithPrices( [ '10.00', '20.00' ] ) ) ).toEqual( [] );
	} );

	it( 'accepts a group where no option is priced', () => {
		expect( validateVariants( true, variantsWithPrices( [ '', '' ] ) ) ).toEqual( [] );
	} );

	it( 'rejects a partially priced group', () => {
		const errors = validateVariants( true, variantsWithPrices( [ '10.00', '' ] ) );

		expect( errors ).toHaveLength( 1 );
		expect( errors[ 0 ] ).toContain( 'required once any option in the group has its own price' );
	} );

	it( 'rejects a non-positive price', () => {
		const errors = validateVariants( true, variantsWithPrices( [ '10.00', '0' ] ) );

		expect( errors ).toHaveLength( 1 );
		expect( errors[ 0 ] ).toContain( 'must be a positive number' );
	} );

	it( 'still requires group names and option labels', () => {
		const errors = validateVariants( true, {
			dimensions: [ { name: '', primary: true, options: [ { label: '' } ] } ],
		} );

		expect( errors ).toHaveLength( 2 );
	} );

	it( 'returns no errors when variants are disabled', () => {
		expect( validateVariants( false, variantsWithPrices( [ '10.00', '' ] ) ) ).toEqual( [] );
	} );
} );
