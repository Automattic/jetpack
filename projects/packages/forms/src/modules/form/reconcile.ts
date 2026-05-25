/**
 * FORMS-685: Store↔DOM reconcile helper
 *
 * When iOS Safari (Private Browsing / Advanced Tracking & Fingerprinting
 * Protection) suppresses the per-keystroke Interactivity-store captures, the
 * store thinks every field is empty even though the DOM inputs hold the typed
 * values.  `reconcileFieldsFromForm` recovers those values from the live DOM
 * so the client-side gate can re-evaluate correctly before blocking submission.
 *
 * `isFormValidFromDom` computes validity directly from the live DOM, without
 * touching or re-reading the store.  Because the store write/read is exactly
 * what is unreliable under Safari's protection, this is the authoritative
 * go/no-go signal in the recovery path.
 *
 * This module is intentionally free of any wordpress/interactivity imports so
 * it can be unit-tested in plain jsdom without the Interactivity runtime.
 */

import { validateField, isEmptyValue } from '../../contact-form/js/validate-helper.js';

/**
 * Shape of a field entry in the Interactivity store context.
 * Only the fields relevant to reconciliation are listed.
 */
export interface StoreField {
	id: string;
	type: string;
	label: string;
	value: unknown;
	isRequired: boolean;
	extra: unknown;
	/** Validation result: 'yes' means valid, anything else is an error key. */
	error?: string;
	/** Step number this field belongs to (1-based, used for multistep forms). */
	step?: number;
	isOtherSelected?: boolean;
	otherLabel?: string | null;
}

/**
 * The minimal slice of store context that reconcileFieldsFromForm needs.
 */
export interface ReconcileContext {
	fields: Record< string, StoreField >;
}

/**
 * Read the current submitted value(s) for a field directly from the form DOM.
 *
 * Returns `null` when we cannot faithfully reconstruct the store-expected
 * value format (e.g. file fields, rating, image-select, hidden inputs, "Other"
 * radio with a custom text value).  The caller must leave those fields' store
 * values untouched when `null` is returned.
 *
 * @param {HTMLFormElement} form  - The form element.
 * @param {StoreField}      field - The store field record.
 * @return {unknown|null} The reconciled value, or null if unrecoverable.
 */
export const readFieldValueFromDom = (
	form: HTMLFormElement,
	field: StoreField
): unknown | null => {
	const { id, type } = field;

	switch ( type ) {
		// ── Simple single-value inputs ───────────────────────────────────────
		case 'text':
		case 'name':
		case 'email':
		case 'url':
		case 'telephone':
		case 'number':
		case 'date':
		case 'time':
		case 'textarea': {
			const el = form.querySelector< HTMLInputElement | HTMLTextAreaElement >(
				`[name="${ CSS.escape( id ) }"]`
			);
			return el ? el.value : null;
		}

		// ── Single checkbox (value = '1' or '') ─────────────────────────────
		case 'checkbox': {
			const el = form.querySelector< HTMLInputElement >(
				`input[type="checkbox"][name="${ CSS.escape( id ) }"]`
			);
			if ( ! el ) {
				return null;
			}
			return el.checked ? '1' : '';
		}

		// ── Consent — implicit hidden always "Yes", explicit checkbox ────────
		case 'consent': {
			// Implicit consent: hidden input with value "Yes"
			const hidden = form.querySelector< HTMLInputElement >(
				`input[type="hidden"][name="${ CSS.escape( id ) }"]`
			);
			if ( hidden ) {
				return hidden.value;
			}
			// Explicit consent: visible checkbox
			const cb = form.querySelector< HTMLInputElement >(
				`input[type="checkbox"][name="${ CSS.escape( id ) }"]`
			);
			if ( cb ) {
				return cb.checked ? '1' : '';
			}
			return null;
		}

		// ── Radio (single choice) ────────────────────────────────────────────
		// The "Other" radio stores "Label: custom text" — we can recover the
		// label part from the input's data attribute, but recovering the custom
		// text requires querying the companion "-other-text" input.
		case 'radio': {
			const checked = form.querySelector< HTMLInputElement >(
				`input[type="radio"][name="${ CSS.escape( id ) }"]:checked`
			);
			if ( ! checked ) {
				return '';
			}

			const otherLabel = checked.getAttribute( 'data-other-label' );
			if ( otherLabel ) {
				// "Other" option is checked — look for the companion text input
				const fieldset = checked.closest( 'fieldset' );
				const otherText = fieldset?.querySelector< HTMLInputElement >(
					'input[name$="-other-text"]'
				);
				const customText = otherText?.value || '';
				return customText ? `${ otherLabel }: ${ customText }` : otherLabel;
			}

			return checked.value;
		}

		// ── Checkbox-multiple (value = string[]) ─────────────────────────────
		case 'checkbox-multiple':
		case 'multiple-checkboxes': {
			const checkboxes = form.querySelectorAll< HTMLInputElement >(
				`input[type="checkbox"][name="${ CSS.escape( id ) }[]"]`
			);
			if ( checkboxes.length === 0 ) {
				return null;
			}
			const values: string[] = [];
			checkboxes.forEach( cb => {
				if ( cb.checked ) {
					values.push( cb.value );
				}
			} );
			return values;
		}

		// ── Select (dropdown) ─────────────────────────────────────────────────
		case 'select':
		case 'dropdown': {
			const el = form.querySelector< HTMLSelectElement >( `select[name="${ CSS.escape( id ) }"]` );
			return el ? el.value : null;
		}

		// ── Slider/range ──────────────────────────────────────────────────────
		case 'range':
		case 'slider': {
			const el = form.querySelector< HTMLInputElement >(
				`input[type="range"][name="${ CSS.escape( id ) }"]`
			);
			return el ? el.value : null;
		}

		// ── Types we cannot faithfully reconstruct ─────────────────────────
		// file    — FormData entries are File objects, not the store's [{name,size,isUploaded}] array
		// rating  — hidden input stores "n/max" string; store uses structured object via getRating()
		// image-select — store uses JSON with letter codes; DOM has individual radio/checkbox inputs
		// hidden  — passive field; never blocks isFormValid
		default:
			return null;
	}
};

/**
 * Reconcile store field values from the live form DOM.
 *
 * For each field whose store value appears empty (or whose store entry doesn't
 * exist yet), we attempt to read the actual value from the DOM.  Returns a map
 * of field-id → recovered value for every field where we successfully read a
 * non-null value.  Fields whose type we cannot handle are omitted so the
 * caller can leave their store values untouched.
 *
 * @param {HTMLFormElement}  form    - The form element.
 * @param {ReconcileContext} context - The Interactivity store context.
 * @return {Map<string, unknown>} Map of field id → recovered DOM value.
 */
export const reconcileFieldsFromForm = (
	form: HTMLFormElement,
	context: ReconcileContext
): Map< string, unknown > => {
	const recovered = new Map< string, unknown >();

	for ( const field of Object.values( context.fields ) ) {
		const domValue = readFieldValueFromDom( form, field );
		if ( domValue !== null ) {
			recovered.set( field.id, domValue );
		}
	}

	return recovered;
};

/**
 * Options for isFormValidFromDom.
 */
export interface IsFormValidFromDomOptions {
	/** True when the form is a multistep form. */
	isMultiStep: boolean;
	/** The current active step (1-based). */
	currentStep: number;
	/** The total number of steps (used to detect multistep mode). */
	maxSteps: number;
}

/**
 * Determine form validity directly from the live DOM, without touching or
 * re-reading the Interactivity store.
 *
 * This is the authoritative go/no-go signal in the FORMS-685 recovery path.
 * Because the store write/read is exactly what is unreliable under Safari's
 * Advanced Tracking & Fingerprinting Protection, we deliberately bypass the
 * store here and validate the values that FormData would actually submit.
 *
 * Algorithm: for each field in `context.fields` (considering only current-step
 * fields in multistep forms): if `readFieldValueFromDom` returns a non-null
 * DOM value, validate that value with `validateField` (must return `'yes'`).
 * If `readFieldValueFromDom` returns null (file, rating, image-select, hidden),
 * fall back to the field's existing store `field.error` value — do NOT falsely
 * pass or fail these; trust whatever the store recorded.
 *
 * The `isFormEmpty` short-circuit is preserved: for non-multistep forms, if
 * every field appears empty in both the DOM and the store, the form is treated
 * as empty (invalid), matching the `state.isFormValid` behaviour.
 *
 * @param {HTMLFormElement}           form    - The live form element.
 * @param {ReconcileContext}          context - The Interactivity store context.
 * @param {IsFormValidFromDomOptions} opts    - Step/multistep configuration.
 * @return {boolean} True only if every considered field is valid.
 */
export const isFormValidFromDom = (
	form: HTMLFormElement,
	context: ReconcileContext,
	opts: IsFormValidFromDomOptions
): boolean => {
	const { isMultiStep, currentStep, maxSteps } = opts;
	const fields = Object.values( context.fields );

	// --- isFormEmpty short-circuit (mirrors state.isFormEmpty) ---------------
	// Multistep forms never fire the "empty form" message (maxSteps guard).
	const isMultiStepForm = isMultiStep && maxSteps > 0;
	if ( ! isMultiStepForm ) {
		// Check whether every field has an empty DOM value.  If so, the form is
		// "empty" — matches the behaviour of `state.isFormEmpty` in the store.
		//
		// For unreadable types (rating, file, image-select): use the store value,
		// but if the store has error='yes' we treat the value as non-empty (because
		// the store successfully captured it — it's just not readable from the DOM).
		const allEmpty = fields.every( field => {
			const domValue = readFieldValueFromDom( form, field );
			if ( domValue !== null ) {
				return isEmptyValue( domValue );
			}
			// Unreadable type: if the store says it's valid, it's non-empty.
			if ( field.error === 'yes' ) {
				return false;
			}
			return isEmptyValue( field.value );
		} );
		if ( allEmpty ) {
			return false;
		}
	}

	// --- Per-field validity --------------------------------------------------
	// For multistep forms, only validate fields on the current step.
	const fieldsToCheck = isMultiStepForm
		? fields.filter( field => field.step === currentStep )
		: fields;

	for ( const field of fieldsToCheck ) {
		const domValue = readFieldValueFromDom( form, field );

		let fieldValid: boolean;
		if ( domValue !== null ) {
			// We can read the DOM — validate the actual submitted value.
			const result = validateField( field.type, domValue, field.isRequired, field.extra ?? null );
			fieldValid = result === 'yes';
		} else {
			// Unreadable type (file, rating, image-select, hidden…).
			// Fall back to whatever the store recorded.
			fieldValid = field.error === 'yes';
		}

		if ( ! fieldValid ) {
			return false;
		}
	}

	return true;
};
