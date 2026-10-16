import { describe, expect, test } from '@jest/globals';
import {
	getFieldTypeIconHtml,
	getFieldTypeIconKey,
} from '../../../../src/modules/form/field-type-icons.js';

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

	test( 'a checkbox left unchecked gets a different icon than a ticked one', () => {
		expect( getFieldTypeIconHtml( 'checkbox', '' ) ).not.toBe(
			getFieldTypeIconHtml( 'checkbox', 'Yes' )
		);
	} );
} );

/**
 * The icon key is what the server writes into `data-rendered-type` and what the
 * hydration callback compares against, so PHP and JS have to agree on it.
 */
describe( 'getFieldTypeIconKey', () => {
	test( 'keys off the field type alone for non-checkbox fields', () => {
		for ( const type of [ 'text', 'email', 'consent', 'checkbox-multiple' ] ) {
			expect( getFieldTypeIconKey( type, '' ) ).toBe( type );
			expect( getFieldTypeIconKey( type, 'Yes' ) ).toBe( type );
		}
	} );

	test( 'treats a ticked checkbox as the plain checkbox key', () => {
		// The stored value is translated, so anything non-empty counts as ticked.
		for ( const value of [ 'Yes', 'Oui', 'true', [ 'a' ] ] ) {
			expect( getFieldTypeIconKey( 'checkbox', value ) ).toBe( 'checkbox' );
		}
	} );

	test( 'treats an unticked checkbox as the unchecked key', () => {
		for ( const value of [ '', '   ', undefined, null, [], 'no', 'No', '0' ] ) {
			expect( getFieldTypeIconKey( 'checkbox', value ) ).toBe( 'checkbox:unchecked' );
		}
	} );
} );
