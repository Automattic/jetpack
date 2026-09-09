/**
 * Tests for variant pricing helpers.
 *
 * PayPal rejects a line item that carries `unit_amount` at both the product level
 * and the variant level, so per-option prices replace the product price. Only the
 * primary group is priced, and one toggle marks it.
 *
 * @package
 */

import {
	getPrimaryDimension,
	hasVariantPricing,
	isVariantPricingOn,
	validateVariants,
} from '../../src/paypal-payment-buttons/components/variant-builder';

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

describe( 'isVariantPricingOn', () => {
	it( 'is true as soon as a group is primary, before any price is typed', () => {
		expect( isVariantPricingOn( true, variantsWithPrices( [ '', '' ] ) ) ).toBe( true );
	} );

	it( 'is false when no group is primary', () => {
		const variants = variantsWithPrices( [ '10.00' ] );
		variants.dimensions[ 0 ].primary = false;

		expect( isVariantPricingOn( true, variants ) ).toBe( false );
	} );

	it( 'is false when variants are disabled', () => {
		expect( isVariantPricingOn( false, variantsWithPrices( [ '10.00' ] ) ) ).toBe( false );
	} );
} );

describe( 'validateVariants', () => {
	it( 'accepts a group where every option is priced', () => {
		expect( validateVariants( true, variantsWithPrices( [ '10.00', '20.00' ] ) ) ).toEqual( [] );
	} );

	it( 'requires a price on every option once the group is primary', () => {
		const errors = validateVariants( true, variantsWithPrices( [ '', '' ] ) );

		expect( errors ).toEqual( [
			{ group: 0, option: 0, field: 'price', message: 'Price is required.' },
			{ group: 0, option: 1, field: 'price', message: 'Price is required.' },
		] );
	} );

	it( 'asks for no price at all when no group is primary', () => {
		const variants = variantsWithPrices( [ '', '' ] );
		variants.dimensions[ 0 ].primary = false;

		expect( validateVariants( true, variants ) ).toEqual( [] );
	} );

	it( 'ignores an amount left on a group that is not primary', () => {
		const variants = {
			dimensions: [
				{
					name: 'Color',
					primary: true,
					options: [ { label: 'Black', unit_amount: { currency_code: 'USD', value: '10.00' } } ],
				},
				{
					name: 'Size',
					primary: false,
					options: [ { label: 'S', unit_amount: { currency_code: 'USD', value: 'nonsense' } } ],
				},
			],
		};

		expect( validateVariants( true, variants ) ).toEqual( [] );
	} );

	it( 'rejects a partially priced group, against the option that is missing a price', () => {
		const errors = validateVariants( true, variantsWithPrices( [ '10.00', '' ] ) );

		expect( errors ).toEqual( [
			{ group: 0, option: 1, field: 'price', message: 'Price is required.' },
		] );
	} );

	it( 'rejects a non-positive price', () => {
		const errors = validateVariants( true, variantsWithPrices( [ '10.00', '0' ] ) );

		expect( errors ).toHaveLength( 1 );
		expect( errors[ 0 ].message ).toContain( 'must be a positive number' );
	} );

	it( 'rejects more than two decimals on an option price', () => {
		const errors = validateVariants( true, variantsWithPrices( [ '10.00', '10.005' ] ) );

		expect( errors ).toHaveLength( 1 );
		expect( errors[ 0 ].message ).toContain( 'at most 2 decimal places' );
	} );

	it( 'rejects a decimal option price in a currency PayPal prices whole', () => {
		const errors = validateVariants( true, variantsWithPrices( [ '1500', '1500.50' ] ), 'JPY' );

		expect( errors ).toHaveLength( 1 );
		expect( errors[ 0 ].message ).toContain( 'Prices in JPY are whole numbers' );
	} );

	it( 'accepts whole-number option prices in a currency PayPal prices whole', () => {
		expect( validateVariants( true, variantsWithPrices( [ '1500', '2000' ] ), 'JPY' ) ).toEqual(
			[]
		);
	} );

	it( 'wants something to price in a group that carries the prices', () => {
		const errors = validateVariants( true, {
			dimensions: [ { name: 'Size', primary: true, options: [] } ],
		} );

		expect( errors ).toEqual( [
			{
				group: 0,
				option: null,
				field: 'options',
				message: 'Add at least one option to price.',
			},
		] );
	} );

	it( 'still requires group names and option labels', () => {
		const errors = validateVariants( true, {
			dimensions: [ { name: '', primary: true, options: [ { label: '' } ] } ],
		} );

		// The group name error belongs to no single option, so it carries option: null.
		// The group is primary, so its option needs a price too.
		expect( errors ).toEqual( [
			{ group: 0, option: null, field: 'name', message: 'Variant name is required.' },
			{ group: 0, option: 0, field: 'label', message: 'Option name is required.' },
			{ group: 0, option: 0, field: 'price', message: 'Price is required.' },
		] );
	} );

	it( 'returns no errors when variants are disabled', () => {
		expect( validateVariants( false, variantsWithPrices( [ '10.00', '' ] ) ) ).toEqual( [] );
	} );
} );
