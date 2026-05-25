/**
 * Unit tests for the FORMS-685 store↔DOM reconcile helper.
 *
 * All tests run in jsdom (the jest default environment) without any
 * wordpress/interactivity runtime — the helper is intentionally side-effect
 * free so these tests can be fast and isolated.
 */
import { describe, test, expect, beforeEach } from '@jest/globals';
import {
	readFieldValueFromDom,
	reconcileFieldsFromForm,
} from '../../../../src/modules/form/reconcile.ts';

// ---------------------------------------------------------------------------
// Helper to create a minimal store field record
// ---------------------------------------------------------------------------
const makeField = ( overrides = {} ) => ( {
	id: 'field-1',
	type: 'text',
	label: 'Name',
	value: '',
	isRequired: true,
	extra: null,
	...overrides,
} );

// ---------------------------------------------------------------------------
// Helper to create a real (jsdom) <form> element with given inner HTML
// ---------------------------------------------------------------------------
const makeForm = html => {
	const form = document.createElement( 'form' );
	form.innerHTML = html;
	document.body.appendChild( form );
	return form;
};

// ---------------------------------------------------------------------------
// readFieldValueFromDom
// ---------------------------------------------------------------------------

describe( 'readFieldValueFromDom — text-like inputs', () => {
	let form;

	beforeEach( () => {
		document.body.innerHTML = '';
		form = makeForm( '<input type="text" name="field-1" value="Hello world" />' );
	} );

	test( 'reads value from a text input', () => {
		const result = readFieldValueFromDom( form, makeField( { id: 'field-1', type: 'text' } ) );
		expect( result ).toBe( 'Hello world' );
	} );

	test( 'reads value from an email input', () => {
		document.body.innerHTML = '';
		form = makeForm( '<input type="email" name="email-field" value="user@example.com" />' );
		const result = readFieldValueFromDom( form, makeField( { id: 'email-field', type: 'email' } ) );
		expect( result ).toBe( 'user@example.com' );
	} );

	test( 'returns empty string when input is present but empty', () => {
		document.body.innerHTML = '';
		form = makeForm( '<input type="text" name="field-1" value="" />' );
		const result = readFieldValueFromDom( form, makeField( { id: 'field-1', type: 'text' } ) );
		expect( result ).toBe( '' );
	} );

	test( 'returns null when input element is absent', () => {
		const result = readFieldValueFromDom(
			form,
			makeField( { id: 'missing-field', type: 'text' } )
		);
		expect( result ).toBeNull();
	} );

	test( 'reads value from a textarea (type=textarea)', () => {
		document.body.innerHTML = '';
		form = makeForm( '<textarea name="msg"></textarea>' );
		form.querySelector( 'textarea' ).value = 'Multi\nline text';
		const result = readFieldValueFromDom( form, makeField( { id: 'msg', type: 'textarea' } ) );
		expect( result ).toBe( 'Multi\nline text' );
	} );

	test( 'reads value from a url input', () => {
		document.body.innerHTML = '';
		form = makeForm( '<input type="url" name="website" value="https://example.com" />' );
		const result = readFieldValueFromDom( form, makeField( { id: 'website', type: 'url' } ) );
		expect( result ).toBe( 'https://example.com' );
	} );
} );

describe( 'readFieldValueFromDom — checkbox (single)', () => {
	let form;

	beforeEach( () => {
		document.body.innerHTML = '';
	} );

	test( 'returns "1" for a checked checkbox', () => {
		form = makeForm( '<input type="checkbox" name="agree" value="Yes" />' );
		form.querySelector( 'input' ).checked = true;
		const result = readFieldValueFromDom( form, makeField( { id: 'agree', type: 'checkbox' } ) );
		expect( result ).toBe( '1' );
	} );

	test( 'returns "" for an unchecked checkbox', () => {
		form = makeForm( '<input type="checkbox" name="agree" value="Yes" />' );
		form.querySelector( 'input' ).checked = false;
		const result = readFieldValueFromDom( form, makeField( { id: 'agree', type: 'checkbox' } ) );
		expect( result ).toBe( '' );
	} );

	test( 'returns null when checkbox is absent', () => {
		form = makeForm( '<input type="text" name="other" />' );
		const result = readFieldValueFromDom( form, makeField( { id: 'agree', type: 'checkbox' } ) );
		expect( result ).toBeNull();
	} );
} );

describe( 'readFieldValueFromDom — radio', () => {
	let form;

	beforeEach( () => {
		document.body.innerHTML = '';
	} );

	test( 'returns the checked radio value', () => {
		form = makeForm( `
			<fieldset>
				<input type="radio" name="color" value="Red" />
				<input type="radio" name="color" value="Blue" checked />
			</fieldset>
		` );
		const result = readFieldValueFromDom( form, makeField( { id: 'color', type: 'radio' } ) );
		expect( result ).toBe( 'Blue' );
	} );

	test( 'returns "" when no radio is checked', () => {
		form = makeForm( `
			<fieldset>
				<input type="radio" name="color" value="Red" />
				<input type="radio" name="color" value="Blue" />
			</fieldset>
		` );
		const result = readFieldValueFromDom( form, makeField( { id: 'color', type: 'radio' } ) );
		expect( result ).toBe( '' );
	} );

	test( 'builds "Label: text" value for Other radio with companion input', () => {
		form = makeForm( `
			<fieldset>
				<input type="radio" name="color" value="Other" data-other-label="Other" checked />
				<input name="color-other-text" value="Magenta" />
			</fieldset>
		` );
		const result = readFieldValueFromDom( form, makeField( { id: 'color', type: 'radio' } ) );
		expect( result ).toBe( 'Other: Magenta' );
	} );

	test( 'returns just the label for Other radio with empty companion input', () => {
		form = makeForm( `
			<fieldset>
				<input type="radio" name="color" value="Other" data-other-label="Other" checked />
				<input name="color-other-text" value="" />
			</fieldset>
		` );
		const result = readFieldValueFromDom( form, makeField( { id: 'color', type: 'radio' } ) );
		expect( result ).toBe( 'Other' );
	} );
} );

describe( 'readFieldValueFromDom — checkbox-multiple', () => {
	let form;

	beforeEach( () => {
		document.body.innerHTML = '';
	} );

	test( 'returns array of checked values', () => {
		form = makeForm( `
			<input type="checkbox" name="colors[]" value="Red" checked />
			<input type="checkbox" name="colors[]" value="Blue" />
			<input type="checkbox" name="colors[]" value="Green" checked />
		` );
		const result = readFieldValueFromDom(
			form,
			makeField( { id: 'colors', type: 'checkbox-multiple' } )
		);
		expect( result ).toEqual( [ 'Red', 'Green' ] );
	} );

	test( 'returns empty array when no checkboxes are checked', () => {
		form = makeForm( `
			<input type="checkbox" name="colors[]" value="Red" />
			<input type="checkbox" name="colors[]" value="Blue" />
		` );
		const result = readFieldValueFromDom(
			form,
			makeField( { id: 'colors', type: 'checkbox-multiple' } )
		);
		expect( result ).toEqual( [] );
	} );

	test( 'returns null when no checkbox inputs with that name exist', () => {
		form = makeForm( '<input type="text" name="other" />' );
		const result = readFieldValueFromDom(
			form,
			makeField( { id: 'colors', type: 'checkbox-multiple' } )
		);
		expect( result ).toBeNull();
	} );

	test( 'also handles multiple-checkboxes type alias', () => {
		form = makeForm( `
			<input type="checkbox" name="opts[]" value="A" checked />
			<input type="checkbox" name="opts[]" value="B" checked />
		` );
		const result = readFieldValueFromDom(
			form,
			makeField( { id: 'opts', type: 'multiple-checkboxes' } )
		);
		expect( result ).toEqual( [ 'A', 'B' ] );
	} );
} );

describe( 'readFieldValueFromDom — select', () => {
	let form;

	beforeEach( () => {
		document.body.innerHTML = '';
	} );

	test( 'returns the selected option value', () => {
		form = makeForm( `
			<select name="size">
				<option value="S">Small</option>
				<option value="M" selected>Medium</option>
				<option value="L">Large</option>
			</select>
		` );
		const result = readFieldValueFromDom( form, makeField( { id: 'size', type: 'select' } ) );
		expect( result ).toBe( 'M' );
	} );

	test( 'returns null when select element is absent', () => {
		form = makeForm( '<input type="text" name="other" />' );
		const result = readFieldValueFromDom( form, makeField( { id: 'size', type: 'select' } ) );
		expect( result ).toBeNull();
	} );
} );

describe( 'readFieldValueFromDom — unrecoverable types', () => {
	let form;

	beforeEach( () => {
		document.body.innerHTML = '';
		form = makeForm( '<input type="hidden" name="rating" value="4/5" />' );
	} );

	test( 'returns null for file type', () => {
		const result = readFieldValueFromDom( form, makeField( { id: 'rating', type: 'file' } ) );
		expect( result ).toBeNull();
	} );

	test( 'returns null for rating type', () => {
		const result = readFieldValueFromDom( form, makeField( { id: 'rating', type: 'rating' } ) );
		expect( result ).toBeNull();
	} );

	test( 'returns null for image-select type', () => {
		const result = readFieldValueFromDom(
			form,
			makeField( { id: 'rating', type: 'image-select' } )
		);
		expect( result ).toBeNull();
	} );

	test( 'returns null for unknown type', () => {
		const result = readFieldValueFromDom(
			form,
			makeField( { id: 'rating', type: 'custom-widget' } )
		);
		expect( result ).toBeNull();
	} );
} );

// ---------------------------------------------------------------------------
// reconcileFieldsFromForm
// ---------------------------------------------------------------------------

describe( 'reconcileFieldsFromForm', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
	} );

	test( 'returns a Map with recovered values for recognisable field types', () => {
		const form = makeForm( `
			<input type="text"  name="name-field"  value="Jane Doe" />
			<input type="email" name="email-field" value="jane@example.com" />
			<select name="size-field">
				<option value="L" selected>Large</option>
			</select>
		` );

		const context = {
			fields: {
				'name-field': makeField( { id: 'name-field', type: 'text', value: '' } ),
				'email-field': makeField( { id: 'email-field', type: 'email', value: '' } ),
				'size-field': makeField( { id: 'size-field', type: 'select', value: '' } ),
			},
		};

		const recovered = reconcileFieldsFromForm( form, context );

		expect( recovered.size ).toBe( 3 );
		expect( recovered.get( 'name-field' ) ).toBe( 'Jane Doe' );
		expect( recovered.get( 'email-field' ) ).toBe( 'jane@example.com' );
		expect( recovered.get( 'size-field' ) ).toBe( 'L' );
	} );

	test( 'omits unrecoverable field types (file, rating, image-select)', () => {
		const form = makeForm( '<input type="hidden" name="rating" value="4/5" />' );

		const context = {
			fields: {
				rating: makeField( { id: 'rating', type: 'rating', value: '' } ),
			},
		};

		const recovered = reconcileFieldsFromForm( form, context );
		expect( recovered.size ).toBe( 0 );
	} );

	test( 'returns empty Map when context has no fields', () => {
		const form = makeForm( '<input type="text" name="name" value="Test" />' );
		const recovered = reconcileFieldsFromForm( form, { fields: {} } );
		expect( recovered.size ).toBe( 0 );
	} );

	test( 'recovers checkbox-multiple as array', () => {
		const form = makeForm( `
			<input type="checkbox" name="hobbies[]" value="Reading" checked />
			<input type="checkbox" name="hobbies[]" value="Gaming" />
			<input type="checkbox" name="hobbies[]" value="Cooking" checked />
		` );

		const context = {
			fields: {
				hobbies: makeField( { id: 'hobbies', type: 'checkbox-multiple', value: [] } ),
			},
		};

		const recovered = reconcileFieldsFromForm( form, context );
		expect( recovered.get( 'hobbies' ) ).toEqual( [ 'Reading', 'Cooking' ] );
	} );

	test( 'recovers a checked radio value', () => {
		const form = makeForm( `
			<fieldset>
				<input type="radio" name="plan" value="basic" />
				<input type="radio" name="plan" value="pro" checked />
			</fieldset>
		` );

		const context = {
			fields: {
				plan: makeField( { id: 'plan', type: 'radio', value: '' } ),
			},
		};

		const recovered = reconcileFieldsFromForm( form, context );
		expect( recovered.get( 'plan' ) ).toBe( 'pro' );
	} );

	test( 'handles mixed recoverable and unrecoverable fields in one pass', () => {
		const form = makeForm( `
			<input type="text"   name="name"   value="Alice" />
			<input type="hidden" name="rating" value="5/5" />
		` );

		const context = {
			fields: {
				name: makeField( { id: 'name', type: 'text', value: '' } ),
				rating: makeField( { id: 'rating', type: 'rating', value: '' } ),
			},
		};

		const recovered = reconcileFieldsFromForm( form, context );
		expect( recovered.size ).toBe( 1 );
		expect( recovered.get( 'name' ) ).toBe( 'Alice' );
		expect( recovered.has( 'rating' ) ).toBe( false );
	} );
} );
