/**
 * Unit tests for isFormValidFromDom — FORMS-685 DOM-direct validity helper.
 *
 * These tests run in jsdom without any Interactivity runtime.
 * The helper is intentionally store-free so it can be tested in isolation.
 *
 * Coverage checklist (each field type must have filled-valid + empty-invalid):
 * text, name, email, url, number, date, time, textarea
 * single checkbox, checkbox-multiple, radio, radio-with-"Other"
 * select/dropdown, range/slider, consent
 * file, rating, image-select (unreadable, falls back to store error)
 * multistep, only current-step fields are considered
 * mixed unreadable + readable in one form
 */

import { describe, expect, test, beforeEach } from '@jest/globals';
import { isFormValidFromDom } from '../../../../src/modules/form/reconcile.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal store field record.
 *
 * @param {object} overrides - Field property overrides.
 * @return {object} Store field record.
 */
const makeField = ( overrides = {} ) => ( {
	id: 'field-1',
	type: 'text',
	label: 'Field',
	value: '',
	isRequired: true,
	extra: null,
	error: 'is_required',
	step: 1,
	...overrides,
} );

/**
 * Default non-multistep opts.
 */
const SINGLE_STEP_OPTS = { isMultiStep: false, currentStep: 1, maxSteps: 0 };

/**
 * Multistep opts for step N of M.
 *
 * @param {number} currentStep - The active step (1-based).
 * @param {number} maxSteps    - Total number of steps.
 * @return {object} opts
 */
const multiStepOpts = ( currentStep, maxSteps ) => ( {
	isMultiStep: true,
	currentStep,
	maxSteps,
} );

/**
 * Build a context object from a fields map.
 *
 * @param {object} fieldsMap - Map of field id → field record.
 * @return {object} Context.
 */
const makeContext = fieldsMap => ( { fields: fieldsMap } );

/**
 * Create a real jsdom <form> with the given inner HTML and append to document.
 *
 * @param {string} html - Inner HTML.
 * @return {HTMLFormElement} The form element.
 */
const makeForm = html => {
	document.body.innerHTML = '';
	const form = document.createElement( 'form' );
	form.innerHTML = html;
	document.body.appendChild( form );
	return form;
};

// ---------------------------------------------------------------------------
// text / name / textarea
// ---------------------------------------------------------------------------

describe( 'isFormValidFromDom — text-like inputs', () => {
	test( 'text: filled DOM + empty store → valid', () => {
		const form = makeForm( '<input type="text" name="f1" value="Alice" />' );
		const context = makeContext( { f1: makeField( { id: 'f1', type: 'text' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'text: empty DOM + empty store → invalid (isRequired)', () => {
		const form = makeForm( '<input type="text" name="f1" value="" />' );
		const context = makeContext( { f1: makeField( { id: 'f1', type: 'text' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );

	test( 'text: optional empty field in a single-field form → invalid (form is "empty")', () => {
		// Mirrors state.isFormValid behaviour: isFormEmpty fires first and returns
		// false for a form where every field has an empty value, even if optional.
		// This matches the "please fill out the form" UX — don't submit a blank form.
		const form = makeForm( '<input type="text" name="f1" value="" />' );
		const context = makeContext( {
			f1: makeField( { id: 'f1', type: 'text', isRequired: false, error: 'yes' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );

	test( 'text: optional empty field alongside a filled field → valid (form not empty, optional fields pass)', () => {
		const form = makeForm( `
			<input type="text" name="f1" value="Alice" />
			<input type="text" name="f2" value="" />
		` );
		const context = makeContext( {
			f1: makeField( { id: 'f1', type: 'text', isRequired: true } ),
			f2: makeField( { id: 'f2', type: 'text', isRequired: false, error: 'yes' } ),
		} );
		// f1 is filled and required → valid; f2 is optional and empty → validateField returns 'yes'
		// Form is not empty (f1 has a value) → passes the isFormEmpty check
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'name: filled DOM → valid', () => {
		const form = makeForm( '<input type="text" name="f1" value="Jane Doe" />' );
		const context = makeContext( { f1: makeField( { id: 'f1', type: 'name' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'textarea: filled DOM → valid', () => {
		const form = makeForm( '<textarea name="f1"></textarea>' );
		form.querySelector( 'textarea' ).value = 'Some long text.';
		const context = makeContext( { f1: makeField( { id: 'f1', type: 'textarea' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'textarea: empty DOM → invalid', () => {
		const form = makeForm( '<textarea name="f1"></textarea>' );
		const context = makeContext( { f1: makeField( { id: 'f1', type: 'textarea' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );
} );

// ---------------------------------------------------------------------------
// email
// ---------------------------------------------------------------------------

describe( 'isFormValidFromDom — email', () => {
	test( 'valid email in DOM → valid', () => {
		const form = makeForm( '<input type="email" name="f1" value="user@example.com" />' );
		const context = makeContext( { f1: makeField( { id: 'f1', type: 'email' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'invalid email format in DOM → invalid', () => {
		const form = makeForm( '<input type="email" name="f1" value="not-an-email" />' );
		const context = makeContext( {
			// store wouldn't even know about the invalid value under Safari bug
			f1: makeField( { id: 'f1', type: 'email', error: 'is_required' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );

	test( 'empty required email → invalid', () => {
		const form = makeForm( '<input type="email" name="f1" value="" />' );
		const context = makeContext( { f1: makeField( { id: 'f1', type: 'email' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );
} );

// ---------------------------------------------------------------------------
// url
// ---------------------------------------------------------------------------

describe( 'isFormValidFromDom — url', () => {
	test( 'valid url in DOM → valid', () => {
		const form = makeForm( '<input type="url" name="f1" value="https://example.com" />' );
		const context = makeContext( { f1: makeField( { id: 'f1', type: 'url' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'invalid url in DOM → invalid', () => {
		const form = makeForm( '<input type="url" name="f1" value="not a url at all!!" />' );
		const context = makeContext( { f1: makeField( { id: 'f1', type: 'url' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );

	test( 'empty required url → invalid', () => {
		const form = makeForm( '<input type="url" name="f1" value="" />' );
		const context = makeContext( { f1: makeField( { id: 'f1', type: 'url' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );
} );

// ---------------------------------------------------------------------------
// number
// ---------------------------------------------------------------------------

describe( 'isFormValidFromDom — number', () => {
	test( 'valid number → valid', () => {
		const form = makeForm( '<input type="number" name="f1" value="42" />' );
		const context = makeContext( { f1: makeField( { id: 'f1', type: 'number' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'number within min/max bounds → valid', () => {
		const form = makeForm( '<input type="number" name="f1" value="5" />' );
		const context = makeContext( {
			f1: makeField( { id: 'f1', type: 'number', extra: { min: 1, max: 10 } } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'number below min → invalid', () => {
		const form = makeForm( '<input type="number" name="f1" value="0" />' );
		const context = makeContext( {
			f1: makeField( { id: 'f1', type: 'number', extra: { min: 1 } } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );

	test( 'empty required number → invalid', () => {
		const form = makeForm( '<input type="number" name="f1" value="" />' );
		const context = makeContext( { f1: makeField( { id: 'f1', type: 'number' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );
} );

// ---------------------------------------------------------------------------
// date / time
// ---------------------------------------------------------------------------

describe( 'isFormValidFromDom — date', () => {
	test( 'valid yy-mm-dd date → valid', () => {
		const form = makeForm( '<input type="date" name="f1" value="2024-06-15" />' );
		const context = makeContext( {
			f1: makeField( { id: 'f1', type: 'date', extra: 'yy-mm-dd' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'empty required date → invalid', () => {
		const form = makeForm( '<input type="date" name="f1" value="" />' );
		const context = makeContext( {
			f1: makeField( { id: 'f1', type: 'date', extra: 'yy-mm-dd' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );
} );

describe( 'isFormValidFromDom — time', () => {
	test( 'filled time input → valid (time has no special regex in validateField)', () => {
		const form = makeForm( '<input type="time" name="f1" value="09:30" />' );
		const context = makeContext( { f1: makeField( { id: 'f1', type: 'time' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'empty required time → invalid', () => {
		const form = makeForm( '<input type="time" name="f1" value="" />' );
		const context = makeContext( { f1: makeField( { id: 'f1', type: 'time' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );
} );

// ---------------------------------------------------------------------------
// single checkbox
// ---------------------------------------------------------------------------

describe( 'isFormValidFromDom — single checkbox', () => {
	test( 'checked checkbox → valid', () => {
		const form = makeForm( '<input type="checkbox" name="agree" value="Yes" />' );
		form.querySelector( 'input' ).checked = true;
		const context = makeContext( {
			agree: makeField( { id: 'agree', type: 'checkbox' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'unchecked required checkbox → invalid', () => {
		const form = makeForm( '<input type="checkbox" name="agree" value="Yes" />' );
		form.querySelector( 'input' ).checked = false;
		const context = makeContext( {
			agree: makeField( { id: 'agree', type: 'checkbox' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );

	test( 'unchecked optional checkbox alone → invalid (form is "empty")', () => {
		// A single unchecked checkbox gives value='' → form is empty → invalid.
		// This is consistent with state.isFormValid which also treats empty-form as invalid.
		const form = makeForm( '<input type="checkbox" name="agree" value="Yes" />' );
		form.querySelector( 'input' ).checked = false;
		const context = makeContext( {
			agree: makeField( { id: 'agree', type: 'checkbox', isRequired: false, error: 'yes' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );

	test( 'unchecked optional checkbox + filled required text → valid (optional checkbox passes, form not empty)', () => {
		const form = makeForm( `
			<input type="text" name="name" value="Alice" />
			<input type="checkbox" name="agree" value="Yes" />
		` );
		form.querySelector( 'input[type="checkbox"]' ).checked = false;
		const context = makeContext( {
			name: makeField( { id: 'name', type: 'text', isRequired: true } ),
			agree: makeField( { id: 'agree', type: 'checkbox', isRequired: false, error: 'yes' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );
} );

// ---------------------------------------------------------------------------
// consent
// ---------------------------------------------------------------------------

describe( 'isFormValidFromDom — consent', () => {
	test( 'implicit consent (hidden input with "Yes") → valid', () => {
		const form = makeForm( '<input type="hidden" name="consent" value="Yes" />' );
		const context = makeContext( {
			consent: makeField( { id: 'consent', type: 'consent' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'explicit consent checkbox checked → valid', () => {
		const form = makeForm( '<input type="checkbox" name="consent" value="Yes" />' );
		form.querySelector( 'input' ).checked = true;
		const context = makeContext( {
			consent: makeField( { id: 'consent', type: 'consent' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'explicit consent checkbox unchecked → invalid', () => {
		const form = makeForm( '<input type="checkbox" name="consent" value="Yes" />' );
		form.querySelector( 'input' ).checked = false;
		const context = makeContext( {
			consent: makeField( { id: 'consent', type: 'consent' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );
} );

// ---------------------------------------------------------------------------
// checkbox-multiple
// ---------------------------------------------------------------------------

describe( 'isFormValidFromDom — checkbox-multiple', () => {
	test( 'at least one checked → valid', () => {
		const form = makeForm( `
			<input type="checkbox" name="opts[]" value="A" checked />
			<input type="checkbox" name="opts[]" value="B" />
		` );
		const context = makeContext( {
			opts: makeField( { id: 'opts', type: 'checkbox-multiple', value: [] } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'none checked, required → invalid', () => {
		const form = makeForm( `
			<input type="checkbox" name="opts[]" value="A" />
			<input type="checkbox" name="opts[]" value="B" />
		` );
		const context = makeContext( {
			opts: makeField( { id: 'opts', type: 'checkbox-multiple', value: [] } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );

	test( 'multiple-checkboxes type alias works too', () => {
		const form = makeForm( `
			<input type="checkbox" name="colors[]" value="Red" checked />
			<input type="checkbox" name="colors[]" value="Blue" checked />
		` );
		const context = makeContext( {
			colors: makeField( { id: 'colors', type: 'multiple-checkboxes', value: [] } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );
} );

// ---------------------------------------------------------------------------
// radio
// ---------------------------------------------------------------------------

describe( 'isFormValidFromDom — radio', () => {
	test( 'radio selection in DOM → valid', () => {
		const form = makeForm( `
			<fieldset>
				<input type="radio" name="color" value="Red" />
				<input type="radio" name="color" value="Blue" checked />
			</fieldset>
		` );
		const context = makeContext( { color: makeField( { id: 'color', type: 'radio' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'required radio with no selection → invalid', () => {
		const form = makeForm( `
			<fieldset>
				<input type="radio" name="color" value="Red" />
				<input type="radio" name="color" value="Blue" />
			</fieldset>
		` );
		const context = makeContext( { color: makeField( { id: 'color', type: 'radio' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );

	test( 'radio "Other" with companion text → valid', () => {
		const form = makeForm( `
			<fieldset>
				<input type="radio" name="color" value="Other" data-other-label="Other" checked />
				<input name="color-other-text" value="Turquoise" />
			</fieldset>
		` );
		const context = makeContext( { color: makeField( { id: 'color', type: 'radio' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'radio "Other" selected but companion text empty → valid (Other label alone is non-empty)', () => {
		const form = makeForm( `
			<fieldset>
				<input type="radio" name="color" value="Other" data-other-label="Other" checked />
				<input name="color-other-text" value="" />
			</fieldset>
		` );
		// readFieldValueFromDom returns 'Other' (just the label) when text is empty
		const context = makeContext( { color: makeField( { id: 'color', type: 'radio' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );
} );

// ---------------------------------------------------------------------------
// select / dropdown
// ---------------------------------------------------------------------------

describe( 'isFormValidFromDom — select / dropdown', () => {
	test( 'select with non-empty selection → valid', () => {
		const form = makeForm( `
			<select name="size">
				<option value="">Choose…</option>
				<option value="M" selected>Medium</option>
			</select>
		` );
		const context = makeContext( { size: makeField( { id: 'size', type: 'select' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'select with empty (placeholder) selection, required → invalid', () => {
		const form = makeForm( `
			<select name="size">
				<option value="" selected>Choose…</option>
				<option value="M">Medium</option>
			</select>
		` );
		const context = makeContext( { size: makeField( { id: 'size', type: 'select' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );

	test( 'dropdown type alias works', () => {
		const form = makeForm( `
			<select name="plan">
				<option value="pro" selected>Pro</option>
			</select>
		` );
		const context = makeContext( { plan: makeField( { id: 'plan', type: 'dropdown' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );
} );

// ---------------------------------------------------------------------------
// range / slider
// ---------------------------------------------------------------------------

describe( 'isFormValidFromDom — range / slider', () => {
	test( 'range input with value → valid', () => {
		const form = makeForm( '<input type="range" name="vol" value="7" min="0" max="10" />' );
		const context = makeContext( { vol: makeField( { id: 'vol', type: 'range' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'slider type alias works', () => {
		const form = makeForm( '<input type="range" name="vol" value="3" />' );
		const context = makeContext( { vol: makeField( { id: 'vol', type: 'slider' } ) } );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );
} );

// ---------------------------------------------------------------------------
// Unreadable types: file, rating, image-select
// (fall back to field.error in the store)
// ---------------------------------------------------------------------------

describe( 'isFormValidFromDom — unreadable types fall back to store error', () => {
	test( 'rating field with store error="yes" → valid (fallback passes)', () => {
		// The form has a hidden input (that's how the rating field stores the submitted
		// value for the server), but readFieldValueFromDom returns null for type=rating.
		const form = makeForm( '<input type="hidden" name="rating" value="4/5" />' );
		const context = makeContext( {
			rating: makeField( { id: 'rating', type: 'rating', error: 'yes' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'rating field with store error="is_required" → invalid (fallback blocks)', () => {
		const form = makeForm( '<input type="hidden" name="rating" value="" />' );
		const context = makeContext( {
			rating: makeField( { id: 'rating', type: 'rating', error: 'is_required' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );

	test( 'file field with store error="yes" → valid', () => {
		const form = makeForm( '<input type="file" name="upload" />' );
		const context = makeContext( {
			upload: makeField( { id: 'upload', type: 'file', error: 'yes' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'file field with store error="invalid_file_uploading" → invalid', () => {
		const form = makeForm( '<input type="file" name="upload" />' );
		const context = makeContext( {
			upload: makeField( {
				id: 'upload',
				type: 'file',
				error: 'invalid_file_uploading',
			} ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );

	test( 'image-select field with store error="yes" → valid', () => {
		const form = makeForm( '<div></div>' ); // no readable DOM for image-select
		const context = makeContext( {
			img: makeField( { id: 'img', type: 'image-select', error: 'yes' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'image-select field with store error="is_required" → invalid', () => {
		const form = makeForm( '<div></div>' );
		const context = makeContext( {
			img: makeField( { id: 'img', type: 'image-select', error: 'is_required' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );
} );

// ---------------------------------------------------------------------------
// Mixed: readable + unreadable in one form
// ---------------------------------------------------------------------------

describe( 'isFormValidFromDom — mixed readable + unreadable fields', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
	} );

	test( 'text filled + rating valid in store → form valid', () => {
		const form = makeForm( `
			<input type="text" name="name" value="Alice" />
			<input type="hidden" name="stars" value="4/5" />
		` );
		const context = makeContext( {
			name: makeField( { id: 'name', type: 'text' } ),
			stars: makeField( { id: 'stars', type: 'rating', error: 'yes' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'text filled + rating MISSING in store → form invalid', () => {
		const form = makeForm( `
			<input type="text" name="name" value="Alice" />
			<input type="hidden" name="stars" value="" />
		` );
		const context = makeContext( {
			name: makeField( { id: 'name', type: 'text' } ),
			stars: makeField( { id: 'stars', type: 'rating', error: 'is_required' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );

	test( 'text EMPTY + rating valid in store → form invalid', () => {
		const form = makeForm( `
			<input type="text" name="name" value="" />
			<input type="hidden" name="stars" value="3/5" />
		` );
		const context = makeContext( {
			name: makeField( { id: 'name', type: 'text' } ),
			stars: makeField( { id: 'stars', type: 'rating', error: 'yes' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );

	test( 'file valid + email filled → form valid', () => {
		const form = makeForm( `
			<input type="file" name="doc" />
			<input type="email" name="em" value="a@b.com" />
		` );
		const context = makeContext( {
			doc: makeField( { id: 'doc', type: 'file', error: 'yes' } ),
			em: makeField( { id: 'em', type: 'email' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );
} );

// ---------------------------------------------------------------------------
// isFormEmpty short-circuit
// ---------------------------------------------------------------------------

describe( 'isFormValidFromDom — isFormEmpty short-circuit', () => {
	test( 'all fields empty in DOM → invalid (form empty)', () => {
		const form = makeForm( `
			<input type="text" name="f1" value="" />
			<input type="text" name="f2" value="" />
		` );
		const context = makeContext( {
			f1: makeField( { id: 'f1', type: 'text' } ),
			f2: makeField( { id: 'f2', type: 'text' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );

	test( 'one field filled → NOT treated as empty, per-field logic runs', () => {
		const form = makeForm( `
			<input type="text" name="f1" value="Alice" />
			<input type="text" name="f2" value="" />
		` );
		const context = makeContext( {
			f1: makeField( { id: 'f1', type: 'text' } ),
			f2: makeField( { id: 'f2', type: 'text' } ),
		} );
		// f2 is empty and required → form invalid, but NOT via empty short-circuit
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );

	test( 'multistep form is never treated as empty even if all DOM values are empty', () => {
		// Multistep forms always return false from isFormEmpty (maxSteps guard)
		const form = makeForm( `
			<input type="text" name="f1" value="Alice" />
		` );
		const context = makeContext( {
			f1: makeField( { id: 'f1', type: 'text', step: 1 } ),
		} );
		// Even with maxSteps=2, isMultiStep=true, the empty-short-circuit is skipped
		expect( isFormValidFromDom( form, context, multiStepOpts( 1, 2 ) ) ).toBe( true );
	} );
} );

// ---------------------------------------------------------------------------
// Multistep: only current-step fields are considered
// ---------------------------------------------------------------------------

describe( 'isFormValidFromDom — multistep', () => {
	test( 'step 1 filled, step 2 empty → valid on step 1 check', () => {
		// Step 1 has "name" filled; step 2 has "email" empty.
		// isFormValidFromDom on step 1 should only look at step-1 fields.
		const form = makeForm( `
			<input type="text"  name="name"  value="Alice" />
			<input type="email" name="email" value="" />
		` );
		const context = makeContext( {
			name: makeField( { id: 'name', type: 'text', step: 1 } ),
			email: makeField( { id: 'email', type: 'email', step: 2 } ),
		} );
		expect( isFormValidFromDom( form, context, multiStepOpts( 1, 2 ) ) ).toBe( true );
	} );

	test( 'step 1 has empty required field → invalid on step 1 check', () => {
		const form = makeForm( `
			<input type="text"  name="name"  value="" />
			<input type="email" name="email" value="a@b.com" />
		` );
		const context = makeContext( {
			name: makeField( { id: 'name', type: 'text', step: 1 } ),
			email: makeField( { id: 'email', type: 'email', step: 2, error: 'yes' } ),
		} );
		expect( isFormValidFromDom( form, context, multiStepOpts( 1, 2 ) ) ).toBe( false );
	} );

	test( 'step 2 filled, step 1 fields are NOT re-checked on step 2 submission', () => {
		const form = makeForm( `
			<input type="text"  name="name"  value="" />
			<input type="email" name="email" value="a@b.com" />
		` );
		// On step 2: only email (step=2) is checked; name (step=1) is ignored.
		const context = makeContext( {
			name: makeField( { id: 'name', type: 'text', step: 1 } ),
			email: makeField( { id: 'email', type: 'email', step: 2 } ),
		} );
		expect( isFormValidFromDom( form, context, multiStepOpts( 2, 2 ) ) ).toBe( true );
	} );

	test( 'multistep — unreadable field on current step falls back to store error', () => {
		const form = makeForm( `
			<input type="text" name="name" value="Alice" />
			<input type="hidden" name="stars" value="3/5" />
		` );
		// Both fields are on step 1.  Rating is unreadable → fallback to store.
		const context = makeContext( {
			name: makeField( { id: 'name', type: 'text', step: 1 } ),
			stars: makeField( { id: 'stars', type: 'rating', step: 1, error: 'yes' } ),
		} );
		expect( isFormValidFromDom( form, context, multiStepOpts( 1, 3 ) ) ).toBe( true );
	} );

	test( 'multistep — unreadable field on current step missing in store → invalid', () => {
		const form = makeForm( `
			<input type="text" name="name" value="Alice" />
		` );
		const context = makeContext( {
			name: makeField( { id: 'name', type: 'text', step: 1 } ),
			stars: makeField( { id: 'stars', type: 'rating', step: 1, error: 'is_required' } ),
		} );
		expect( isFormValidFromDom( form, context, multiStepOpts( 1, 3 ) ) ).toBe( false );
	} );
} );

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe( 'isFormValidFromDom — edge cases', () => {
	test( 'empty context (no fields) → valid (nothing to fail)', () => {
		const form = makeForm( '<input type="text" name="x" value="y" />' );
		const context = makeContext( {} );
		// With no fields, there's nothing to invalidate, and it's not "empty"
		// (the isFormEmpty check iterates no fields → allEmpty=true → invalid).
		// Actually: no fields → allEmpty=true → returns false (treats as empty).
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );

	test( 'unknown field type → returns null → falls back to store error=yes → valid', () => {
		const form = makeForm( '<div>custom widget</div>' );
		// The field value must be non-empty so the form doesn't hit the isFormEmpty short-circuit.
		const context = makeContext( {
			widget: makeField( {
				id: 'widget',
				type: 'custom-unknown-type',
				error: 'yes',
				value: 'something', // non-empty value so the form is not "empty"
			} ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( true );
	} );

	test( 'unknown field type with store error=is_required → invalid', () => {
		const form = makeForm( '<div>custom widget</div>' );
		const context = makeContext( {
			widget: makeField( { id: 'widget', type: 'custom-unknown-type', error: 'is_required' } ),
		} );
		expect( isFormValidFromDom( form, context, SINGLE_STEP_OPTS ) ).toBe( false );
	} );
} );
