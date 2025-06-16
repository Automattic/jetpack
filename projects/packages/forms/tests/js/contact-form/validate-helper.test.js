// Add these mocks at the top of your test file
import { validateField, validateDate } from '../../../src/contact-form/js/validate-helper';

// To run these test:
// cd projects/packages/forms && pnpm test

describe( 'validateDate', () => {
	// Test mm/dd/yy format
	describe( 'mm/dd/yy format', () => {
		const format = 'mm/dd/yy';

		test( 'validates correct dates', () => {
			expect( validateDate( '12/31/2023', format ) ).toBe( true );
			expect( validateDate( '01/01/2024', format ) ).toBe( true );
			expect( validateDate( '02/29/2024', format ) ).toBe( true ); // leap year
		} );

		test( 'invalidates incorrect dates', () => {
			expect( validateDate( '13/01/2023', format ) ).toBe( false ); // invalid month
			expect( validateDate( '00/01/2023', format ) ).toBe( false ); // invalid month
			expect( validateDate( '12/32/2023', format ) ).toBe( false ); // invalid day
			expect( validateDate( '12/00/2023', format ) ).toBe( false ); // invalid day
			expect( validateDate( '02/29/2023', format ) ).toBe( false ); // not a leap year
		} );

		test( 'invalidates malformed inputs', () => {
			expect( validateDate( '12-31-2023', format ) ).toBe( false ); // wrong separator
			expect( validateDate( '12/31/', format ) ).toBe( false ); // incomplete
			expect( validateDate( 'abc', format ) ).toBe( false ); // nonsense input
		} );
	} );

	// Test dd/mm/yy format
	describe( 'dd/mm/yy format', () => {
		const format = 'dd/mm/yy';

		test( 'validates correct dates', () => {
			expect( validateDate( '31/12/2023', format ) ).toBe( true );
			expect( validateDate( '01/01/2024', format ) ).toBe( true );
			expect( validateDate( '29/02/2024', format ) ).toBe( true ); // leap year
		} );

		test( 'invalidates incorrect dates', () => {
			expect( validateDate( '32/12/2023', format ) ).toBe( false ); // invalid day
			expect( validateDate( '00/12/2023', format ) ).toBe( false ); // invalid day
			expect( validateDate( '31/13/2023', format ) ).toBe( false ); // invalid month
			expect( validateDate( '31/00/2023', format ) ).toBe( false ); // invalid month
			expect( validateDate( '29/02/2023', format ) ).toBe( false ); // not a leap year
		} );

		test( 'invalidates malformed inputs', () => {
			expect( validateDate( '31-12-2023', format ) ).toBe( false ); // wrong separator
			expect( validateDate( '31/12/', format ) ).toBe( false ); // incomplete
			expect( validateDate( 'abc', format ) ).toBe( false ); // nonsense input
		} );
	} );

	// Test yy-mm-dd format
	describe( 'yy-mm-dd format', () => {
		const format = 'yy-mm-dd';

		test( 'validates correct dates', () => {
			expect( validateDate( '2023-12-31', format ) ).toBe( true );
			expect( validateDate( '2024-01-01', format ) ).toBe( true );
			expect( validateDate( '2024-02-29', format ) ).toBe( true ); // leap year
		} );

		test( 'invalidates incorrect dates', () => {
			expect( validateDate( '2023-13-01', format ) ).toBe( false ); // invalid month
			expect( validateDate( '2023-00-01', format ) ).toBe( false ); // invalid month
			expect( validateDate( '2023-12-32', format ) ).toBe( false ); // invalid day
			expect( validateDate( '2023-12-00', format ) ).toBe( false ); // invalid day
			expect( validateDate( '2023-02-29', format ) ).toBe( false ); // not a leap year
		} );

		test( 'invalidates malformed inputs', () => {
			expect( validateDate( '2023/12/31', format ) ).toBe( false ); // wrong separator
			expect( validateDate( '2023-12-', format ) ).toBe( false ); // incomplete
			expect( validateDate( 'abc', format ) ).toBe( false ); // nonsense input
		} );
	} );

	// Test invalid format
	test( 'returns false for invalid format', () => {
		expect( validateDate( '12/31/2023', 'invalid-format' ) ).toBe( false );
	} );

	// Test empty/null inputs
	test( 'handles empty/null inputs', () => {
		expect( validateDate( '', 'mm/dd/yy' ) ).toBe( false );
		expect( validateDate( null, 'mm/dd/yy' ) ).toBe( false );
		expect( validateDate( undefined, 'mm/dd/yy' ) ).toBe( false );
	} );
} );

describe( 'validateField', () => {
	describe( 'required field validation', () => {
		test( 'returns is_required for empty required fields', () => {
			expect( validateField( 'text', '', true ) ).toBe( 'is_required' );
			expect( validateField( 'email', '', true ) ).toBe( 'is_required' );
			expect( validateField( 'number', '', true ) ).toBe( 'is_required' );
		} );

		test( 'returns yes for empty optional fields', () => {
			expect( validateField( 'text', '', false ) ).toBe( 'yes' );
			expect( validateField( 'email', '', false ) ).toBe( 'yes' );
			expect( validateField( 'number', '', false ) ).toBe( 'yes' );
		} );
	} );

	describe( 'email validation', () => {
		test( 'validates correct email formats', () => {
			expect( validateField( 'email', 'test@example.com', true ) ).toBe( 'yes' );
			expect( validateField( 'email', 'user.name+tag@domain.co.uk', true ) ).toBe( 'yes' );
		} );

		test( 'invalidates incorrect email formats', () => {
			expect( validateField( 'email', 'test@', true ) ).toBe( 'invalid_email' );
			expect( validateField( 'email', 'test@domain', true ) ).toBe( 'invalid_email' );
			expect( validateField( 'email', '@domain.com', true ) ).toBe( 'invalid_email' );
			expect( validateField( 'email', 'test domain.com', true ) ).toBe( 'invalid_email' );
		} );
	} );

	describe( 'telephone validation', () => {
		test( 'validates correct telephone formats', () => {
			expect( validateField( 'telephone', '1234567890', true ) ).toBe( 'yes' );
			expect( validateField( 'telephone', '+1 (123) 456-7890', true ) ).toBe( 'yes' );
			expect( validateField( 'telephone', '123-456-7890', true ) ).toBe( 'yes' );
		} );

		test( 'invalidates incorrect telephone formats', () => {
			expect( validateField( 'telephone', 'abc123', true ) ).toBe( 'invalid_telephone' );
			expect( validateField( 'telephone', '123*456*7890', true ) ).toBe( 'invalid_telephone' );
			expect( validateField( 'telephone', 'phone: 123456', true ) ).toBe( 'invalid_telephone' );
		} );
	} );

	describe( 'number validation', () => {
		test( 'validates correct number formats', () => {
			expect( validateField( 'number', '123', true ) ).toBe( 'yes' );
			expect( validateField( 'number', '0', true ) ).toBe( 'yes' );
			expect( validateField( 'number', '123.45', true ) ).toBe( 'yes' );
			expect( validateField( 'number', '5', true, { min: 1, max: 10 } ) ).toBe( 'yes' );
			expect( validateField( 'number', '5', true, { min: 1 } ) ).toBe( 'yes' );
			expect( validateField( 'number', '5', true, { max: 6 } ) ).toBe( 'yes' );
			expect( validateField( 'number', '5', true, { min: 5 } ) ).toBe( 'yes' );
			expect( validateField( 'number', '5', true, { max: 5 } ) ).toBe( 'yes' );
		} );

		test( 'invalidates incorrect number formats', () => {
			expect( validateField( 'number', '123a', true ) ).toBe( 'invalid_number' );
		} );

		test( 'invalidates incorrect max number formats', () => {
			expect( validateField( 'number', '11', true, { max: 10 } ) ).toBe( 'invalid_max_number' );
		} );

		test( 'invalidates incorrect minnumber formats', () => {
			expect( validateField( 'number', '9', true, { min: 10 } ) ).toBe( 'invalid_min_number' );
		} );
	} );

	describe( 'url validation', () => {
		test( 'validates correct url formats', () => {
			expect( validateField( 'url', 'https://example.com', true ) ).toBe( 'yes' );
			expect( validateField( 'url', 'http://subdomain.example.co.uk/path', true ) ).toBe( 'yes' );
			expect( validateField( 'url', 'ftp://example.com', true ) ).toBe( 'yes' );
			expect( validateField( 'url', 'example.com', true ) ).toBe( 'yes' );
		} );

		test( 'invalidates incorrect url formats', () => {
			expect( validateField( 'url', 'examplecom', true ) ).toBe( 'invalid_url' );
		} );
	} );

	describe( 'checkbox-multiple validation', () => {
		test( 'validates non-empty array values', () => {
			expect( validateField( 'checkbox-multiple', [ 'option1' ], true ) ).toBe( 'yes' );
			expect( validateField( 'checkbox-multiple', [ 'option1', 'option2' ], true ) ).toBe( 'yes' );
		} );

		test( 'invalidates empty array values for required fields', () => {
			expect( validateField( 'checkbox-multiple', [], true ) ).toBe( 'is_required' );
		} );
	} );

	describe( 'date validation', () => {
		test( 'validates correct date formats', () => {
			expect( validateField( 'date', '12/31/2023', true, 'mm/dd/yy' ) ).toBe( 'yes' );
			expect( validateField( 'date', '2023-12-31', true, 'yy-mm-dd' ) ).toBe( 'yes' );
		} );

		test( 'invalidates incorrect date formats', () => {
			expect( validateField( 'date', '13/31/2023', true, 'mm/dd/yy' ) ).toBe( 'invalid_date' );
			expect( validateField( 'date', '2023/12/31', true, 'yy-mm-dd' ) ).toBe( 'invalid_date' );
		} );
	} );

	describe( 'fallthrough validation', () => {
		test( 'returns yes for unrecognized field types with values', () => {
			expect( validateField( 'unknown-type', 'some value', true ) ).toBe( 'yes' );
		} );
	} );
} );
