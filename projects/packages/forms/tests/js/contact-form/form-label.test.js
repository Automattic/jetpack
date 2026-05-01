/**
 * Tests for form-label utility functions
 */

import { describe, expect, it, jest } from '@jest/globals';

await jest.unstable_mockModule( '@wordpress/i18n', () => ( {
	__: str => str,
	_x: str => str,
	sprintf: ( format, ...args ) => {
		let result = format;
		args.forEach( ( arg, index ) => {
			result = result.replace( `%${ index + 1 }$s`, arg ).replace( '%s', arg );
		} );
		return result;
	},
} ) );

const { extractTitleText, formatFormLabel, STATUS_LABELS, DEFAULT_FORM_LABEL } = await import(
	'../../../src/blocks/contact-form/util/form-label'
);

describe( 'extractTitleText', () => {
	it( 'returns the string when title is a string', () => {
		expect( extractTitleText( 'My Form Title' ) ).toBe( 'My Form Title' );
	} );

	it( 'returns empty string for empty string input', () => {
		expect( extractTitleText( '' ) ).toBe( '' );
	} );

	it( 'extracts rendered property from object', () => {
		expect( extractTitleText( { rendered: 'Rendered Title' } ) ).toBe( 'Rendered Title' );
	} );

	it( 'returns empty string for object without rendered property', () => {
		expect( extractTitleText( { other: 'value' } ) ).toBe( '' );
	} );

	it( 'returns empty string for undefined', () => {
		expect( extractTitleText( undefined ) ).toBe( '' );
	} );

	it( 'returns empty string for null', () => {
		expect( extractTitleText( null ) ).toBe( '' );
	} );

	it( 'returns empty string for number', () => {
		expect( extractTitleText( 123 ) ).toBe( '' );
	} );
} );

describe( 'formatFormLabel', () => {
	it( 'formats published form with title', () => {
		const result = formatFormLabel( {
			title: 'Contact Us',
			status: 'publish',
		} );
		expect( result ).toBe( 'Form: Contact Us' );
	} );

	it( 'uses default label when title is empty for published form', () => {
		const result = formatFormLabel( {
			title: '',
			status: 'publish',
			defaultLabel: 'Form',
		} );
		expect( result ).toBe( 'Form: Form' );
	} );

	it( 'formats draft form with title and status', () => {
		const result = formatFormLabel( {
			title: 'My Draft Form',
			status: 'draft',
		} );
		expect( result ).toBe( 'Form: My Draft Form (Draft)' );
	} );

	it( 'formats pending form with title and status', () => {
		const result = formatFormLabel( {
			title: 'Pending Review',
			status: 'pending',
		} );
		expect( result ).toBe( 'Form: Pending Review (Pending)' );
	} );

	it( 'formats scheduled form with title and status', () => {
		const result = formatFormLabel( {
			title: 'Future Form',
			status: 'future',
		} );
		expect( result ).toBe( 'Form: Future Form (Scheduled)' );
	} );

	it( 'formats private form with title and status', () => {
		const result = formatFormLabel( {
			title: 'Secret Form',
			status: 'private',
		} );
		expect( result ).toBe( 'Form: Secret Form (Private)' );
	} );

	it( 'formats trashed form with title and status', () => {
		const result = formatFormLabel( {
			title: 'Deleted Form',
			status: 'trash',
		} );
		expect( result ).toBe( 'Form: Deleted Form (Trashed)' );
	} );

	it( 'uses raw status when status is unknown', () => {
		const result = formatFormLabel( {
			title: 'Custom Status Form',
			status: 'custom-status',
		} );
		expect( result ).toBe( 'Form: Custom Status Form (custom-status)' );
	} );

	it( 'uses default label when title is empty for non-published form', () => {
		const result = formatFormLabel( {
			title: '',
			status: 'draft',
			defaultLabel: 'Form',
		} );
		expect( result ).toBe( 'Form: Form (Draft)' );
	} );

	it( 'uses DEFAULT_FORM_LABEL when defaultLabel not provided', () => {
		const result = formatFormLabel( {
			title: '',
			status: 'publish',
		} );
		expect( result ).toBe( `Form: ${ DEFAULT_FORM_LABEL }` );
	} );
} );

describe( 'STATUS_LABELS', () => {
	it( 'has all expected status labels', () => {
		expect( STATUS_LABELS ).toHaveProperty( 'draft' );
		expect( STATUS_LABELS ).toHaveProperty( 'pending' );
		expect( STATUS_LABELS ).toHaveProperty( 'future' );
		expect( STATUS_LABELS ).toHaveProperty( 'private' );
		expect( STATUS_LABELS ).toHaveProperty( 'trash' );
	} );

	it( 'does not have publish status (published forms show no status)', () => {
		expect( STATUS_LABELS ).not.toHaveProperty( 'publish' );
	} );
} );

describe( 'DEFAULT_FORM_LABEL', () => {
	it( 'is defined', () => {
		expect( DEFAULT_FORM_LABEL ).toBeDefined();
		expect( typeof DEFAULT_FORM_LABEL ).toBe( 'string' );
	} );
} );
