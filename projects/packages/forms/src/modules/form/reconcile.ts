/**
 * FORMS-685: Store↔DOM reconcile helper
 *
 * When iOS Safari (Private Browsing / Advanced Tracking & Fingerprinting
 * Protection) suppresses the per-keystroke Interactivity-store captures, the
 * store thinks every field is empty even though the DOM inputs hold the typed
 * values.  `reconcileFieldsFromForm` recovers those values from the live DOM
 * so the client-side gate can re-evaluate correctly before blocking submission.
 *
 * This module is intentionally free of any wordpress/interactivity imports so
 * it can be unit-tested in plain jsdom without the Interactivity runtime.
 */

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
