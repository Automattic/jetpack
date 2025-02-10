// Add these mocks at the top of your test file
import { validateDate } from '../../../src/contact-form/js/validate-helper';

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
