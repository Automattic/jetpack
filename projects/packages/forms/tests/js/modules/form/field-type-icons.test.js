import { describe, expect, test } from '@jest/globals';
import { getFieldTypeIconHtml } from '../../../../src/modules/form/field-type-icons.js';

/**
 * Tests for the getFieldTypeIconHtml function.
 *
 * This function maps field types to their SVG icon markup, falling back
 * to the text field icon for unknown types.
 *
 * Note: In Jest, Webpack's ?raw loader is not active, so SVG imports return
 * module references instead of actual SVG content. These tests verify the
 * mapping logic rather than the actual SVG content.
 */
describe( 'getFieldTypeIconHtml', () => {
	test( 'returns a value for known field types', () => {
		const knownTypes = [
			'text',
			'textarea',
			'name',
			'email',
			'phone',
			'telephone',
			'url',
			'date',
			'time',
			'number',
			'select',
			'radio',
			'checkbox',
			'checkbox-multiple',
			'file',
			'rating',
			'consent',
			'image-select',
			'slider',
		];

		for ( const type of knownTypes ) {
			const icon = getFieldTypeIconHtml( type );
			expect( icon ).toBeDefined();
			expect( icon ).toBeTruthy();
		}
	} );

	test( 'returns text icon for unknown field types', () => {
		const textIcon = getFieldTypeIconHtml( 'text' );
		const unknownIcon = getFieldTypeIconHtml( 'unknown-field-type' );

		expect( unknownIcon ).toBe( textIcon );
	} );

	test( 'returns text icon for undefined field type', () => {
		const textIcon = getFieldTypeIconHtml( 'text' );
		const undefinedIcon = getFieldTypeIconHtml( undefined );

		expect( undefinedIcon ).toBe( textIcon );
	} );

	test( 'returns text icon for null field type', () => {
		const textIcon = getFieldTypeIconHtml( 'text' );
		const nullIcon = getFieldTypeIconHtml( null );

		expect( nullIcon ).toBe( textIcon );
	} );

	test( 'phone and telephone map to the same icon', () => {
		const phoneIcon = getFieldTypeIconHtml( 'phone' );
		const telephoneIcon = getFieldTypeIconHtml( 'telephone' );

		expect( phoneIcon ).toBe( telephoneIcon );
	} );
} );
