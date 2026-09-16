/**
 * Tests for the customer note validator, which lives in variant-builder.jsx next to
 * validateVariants().
 *
 * @package
 */

import { validateCustomerNotes } from '../../src/paypal-payment-buttons/components/variant-builder';

const required = 'To continue, add the requested info or turn off this feature.';

describe( 'validateCustomerNotes', () => {
	it( 'accepts an empty list', () => {
		expect( validateCustomerNotes( [] ) ).toEqual( [] );
	} );

	it( 'accepts a missing list', () => {
		expect( validateCustomerNotes( undefined ) ).toEqual( [] );
	} );

	it( 'accepts a labelled note', () => {
		expect( validateCustomerNotes( [ { label: 'Engraving', required: true } ] ) ).toEqual( [] );
	} );

	// The index is how the form puts the message under the right row.
	it( 'rejects the second note when its label is blank', () => {
		expect( validateCustomerNotes( [ { label: 'Engraving' }, { label: '' } ] ) ).toEqual( [
			{ index: 1, message: required },
		] );
	} );

	it( 'rejects every blank note', () => {
		expect( validateCustomerNotes( [ { label: '' }, { label: '' } ] ) ).toEqual( [
			{ index: 0, message: required },
			{ index: 1, message: required },
		] );
	} );

	it( 'rejects a whitespace-only label', () => {
		expect( validateCustomerNotes( [ { label: '   ' } ] ) ).toEqual( [
			{ index: 0, message: required },
		] );
	} );

	// A note object with no label key at all, which the validator optional-chains for.
	it( 'rejects a note missing its label', () => {
		expect( validateCustomerNotes( [ { required: true } ] ) ).toEqual( [
			{ index: 0, message: required },
		] );
	} );
} );
