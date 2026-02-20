/**
 * External dependencies
 */
import { describe, expect, it } from '@jest/globals';
/**
 * Internal dependencies
 */
import {
	EMAIL_REGEX,
	FIELD_TYPE_LABEL_PREFIXES,
	inferFieldTypeFromLabel,
} from '../../../../../src/dashboard/components/inspector/response-fields/field-preview/field-preview-utils.ts';

describe( 'field-preview-utils', () => {
	describe( 'EMAIL_REGEX', () => {
		it( 'matches valid email addresses', () => {
			const validEmails = [
				'test@example.com',
				'user.name@domain.org',
				'user+tag@example.co.uk',
				'USER@EXAMPLE.COM',
				'test123@test-domain.net',
			];

			validEmails.forEach( email => {
				expect( EMAIL_REGEX.test( email ) ).toBe( true );
			} );
		} );

		it( 'does not match invalid email addresses', () => {
			const invalidEmails = [
				'notanemail',
				'@nodomain.com',
				'noatsign.com',
				'spaces in@email.com',
				'',
			];

			invalidEmails.forEach( email => {
				expect( EMAIL_REGEX.test( email ) ).toBe( false );
			} );
		} );
	} );

	describe( 'FIELD_TYPE_LABEL_PREFIXES', () => {
		it( 'is an array of tuples with string prefix and field type', () => {
			expect( Array.isArray( FIELD_TYPE_LABEL_PREFIXES ) ).toBe( true );
			expect( FIELD_TYPE_LABEL_PREFIXES.length ).toBeGreaterThan( 0 );

			FIELD_TYPE_LABEL_PREFIXES.forEach( ( [ prefix, fieldType ] ) => {
				expect( typeof prefix ).toBe( 'string' );
				expect( typeof fieldType ).toBe( 'string' );
			} );
		} );

		it( 'has more specific labels before generic ones', () => {
			const prefixes = FIELD_TYPE_LABEL_PREFIXES.map( ( [ prefix ] ) => prefix );

			// "first name" and "last name" should come before "name"
			const firstNameIndex = prefixes.indexOf( 'first name' );
			const lastNameIndex = prefixes.indexOf( 'last name' );
			const nameIndex = prefixes.indexOf( 'name' );

			expect( firstNameIndex ).toBeLessThan( nameIndex );
			expect( lastNameIndex ).toBeLessThan( nameIndex );
		} );
	} );

	describe( 'inferFieldTypeFromLabel', () => {
		describe( 'contact info fields', () => {
			it( 'infers "name" type from name-related labels', () => {
				expect( inferFieldTypeFromLabel( 'Name' ) ).toBe( 'name' );
				expect( inferFieldTypeFromLabel( 'Name:' ) ).toBe( 'name' );
				expect( inferFieldTypeFromLabel( 'First Name' ) ).toBe( 'name' );
				expect( inferFieldTypeFromLabel( 'Last Name' ) ).toBe( 'name' );
			} );

			it( 'infers "email" type from email labels', () => {
				expect( inferFieldTypeFromLabel( 'Email' ) ).toBe( 'email' );
				expect( inferFieldTypeFromLabel( 'Email:' ) ).toBe( 'email' );
				expect( inferFieldTypeFromLabel( 'Email Address' ) ).toBe( 'email' );
			} );

			it( 'infers "telephone" type from phone labels', () => {
				expect( inferFieldTypeFromLabel( 'Phone' ) ).toBe( 'telephone' );
				expect( inferFieldTypeFromLabel( 'Phone:' ) ).toBe( 'telephone' );
				expect( inferFieldTypeFromLabel( 'Phone Number' ) ).toBe( 'telephone' );
			} );

			it( 'infers "url" type from website labels', () => {
				expect( inferFieldTypeFromLabel( 'Website' ) ).toBe( 'url' );
				expect( inferFieldTypeFromLabel( 'Website:' ) ).toBe( 'url' );
			} );
		} );

		describe( 'basic fields', () => {
			it( 'infers "text" type from text labels', () => {
				expect( inferFieldTypeFromLabel( 'Text' ) ).toBe( 'text' );
				expect( inferFieldTypeFromLabel( 'Text Field' ) ).toBe( 'text' );
			} );

			it( 'infers "textarea" type from message labels', () => {
				expect( inferFieldTypeFromLabel( 'Message' ) ).toBe( 'textarea' );
				expect( inferFieldTypeFromLabel( 'Message:' ) ).toBe( 'textarea' );
			} );

			it( 'infers "number" type from number labels', () => {
				expect( inferFieldTypeFromLabel( 'Number' ) ).toBe( 'number' );
			} );
		} );

		describe( 'choice fields', () => {
			it( 'infers "select" type from dropdown labels', () => {
				expect( inferFieldTypeFromLabel( 'Dropdown' ) ).toBe( 'select' );
			} );

			it( 'infers "radio" type from single choice labels', () => {
				expect( inferFieldTypeFromLabel( 'Choose one option' ) ).toBe( 'radio' );
			} );

			it( 'infers "checkbox-multiple" type from multiple choice labels', () => {
				expect( inferFieldTypeFromLabel( 'Choose several options' ) ).toBe( 'checkbox-multiple' );
			} );
		} );

		describe( 'advanced fields', () => {
			it( 'infers "date" type from date labels', () => {
				expect( inferFieldTypeFromLabel( 'Date' ) ).toBe( 'date' );
			} );

			it( 'infers "time" type from time labels', () => {
				expect( inferFieldTypeFromLabel( 'Time' ) ).toBe( 'time' );
			} );

			it( 'infers "file" type from file upload labels', () => {
				expect( inferFieldTypeFromLabel( 'Upload a file' ) ).toBe( 'file' );
			} );

			it( 'infers "slider" type from slider labels', () => {
				expect( inferFieldTypeFromLabel( 'Slider' ) ).toBe( 'slider' );
			} );

			it( 'infers "rating" type from rating labels', () => {
				expect( inferFieldTypeFromLabel( 'Rating' ) ).toBe( 'rating' );
			} );

			it( 'infers "consent" type from consent labels', () => {
				expect(
					inferFieldTypeFromLabel( 'By submitting your information, you agree to our terms' )
				).toBe( 'consent' );
				expect( inferFieldTypeFromLabel( 'Can we send you an email from time to time' ) ).toBe(
					'consent'
				);
			} );
		} );

		describe( 'edge cases', () => {
			it( 'returns null for unrecognized labels', () => {
				expect( inferFieldTypeFromLabel( 'Custom Field' ) ).toBeNull();
				expect( inferFieldTypeFromLabel( 'Something Else' ) ).toBeNull();
				expect( inferFieldTypeFromLabel( 'Random' ) ).toBeNull();
			} );

			it( 'is case-insensitive', () => {
				expect( inferFieldTypeFromLabel( 'EMAIL' ) ).toBe( 'email' );
				expect( inferFieldTypeFromLabel( 'email' ) ).toBe( 'email' );
				expect( inferFieldTypeFromLabel( 'Email' ) ).toBe( 'email' );
				expect( inferFieldTypeFromLabel( 'eMaIl' ) ).toBe( 'email' );
			} );

			it( 'handles trailing colons', () => {
				expect( inferFieldTypeFromLabel( 'Email:' ) ).toBe( 'email' );
				expect( inferFieldTypeFromLabel( 'Name:' ) ).toBe( 'name' );
			} );

			it( 'handles leading/trailing whitespace', () => {
				expect( inferFieldTypeFromLabel( '  Email  ' ) ).toBe( 'email' );
				expect( inferFieldTypeFromLabel( '\tName\t' ) ).toBe( 'name' );
			} );

			it( 'handles empty string', () => {
				expect( inferFieldTypeFromLabel( '' ) ).toBeNull();
			} );
		} );
	} );
} );
