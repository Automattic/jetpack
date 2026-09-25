/**
 * CTA attribution replay (NPPD-1887).
 *
 * The consumer half of the hand-off written by newspack-plugin when a reader clicks a
 * paid-intent CTA inside a gate or prompt and is sent to a landing page. We re-inject
 * the surface's id as a hidden form field, so the existing server chain
 * (`INPUT_GET` -> cart item data -> `_gate_post_id` / `_newspack_popup_id` order meta)
 * fires exactly as it does for a form rendered inside the gate itself.
 *
 * Two cart paths exist, and they apply DIFFERENT filters. Checkout buttons go through
 * `Modal_Checkout::add_to_cart_and_redirect()` -> `newspack_blocks_modal_checkout_cart_item_data`;
 * donations go through `Donations::process_donation_request()` -> `newspack_donations_cart_item_data`.
 * Injecting the field here is necessary but not sufficient — a listener must exist on
 * whichever filter the target form uses, or the id rides all the way into `INPUT_GET`
 * and is then dropped.
 *
 * ── Storage contract ────────────────────────────────────────────────────────────
 * DUPLICATED from newspack-plugin (`src/shared/js/cta-attribution.js`). The two
 * plugins ship independently and share no JS package. Change one, change the other.
 *
 *   sessionStorage[ 'newspack_cta_attribution' ] = JSON.stringify( {
 *     v:    1,
 *     type: 'gate' | 'prompt',
 *     id:   '123',
 *     ts:   1751932800000,
 *   } )
 */

/** Storage key. Shared with newspack-plugin. */
export const STORAGE_KEY = 'newspack_cta_attribution';

/**
 * Storage-record schema version. Must match the writer's in newspack-plugin. A record
 * whose `v` differs is treated as absent rather than trusted, so a drift between the two
 * duplicated copies (e.g. one changes the record shape or TTL) fails safe instead of
 * silently honoring a stale record. (dkoo review, #575.)
 */
export const SCHEMA = 1;

/** Attribution lifetime, in ms. Kept in sync with newspack-plugin. */
export const TTL_MS = 30 * 60 * 1000;

/** Surface type -> the form field the server reads. */
const FIELD_BY_TYPE = {
	gate: 'gate_post_id',
	prompt: 'newspack_popup_id',
};

/**
 * Read a fresh attribution record, or null.
 *
 * Never throws: `sessionStorage` access raises in Safari private mode, and the stored
 * value is user-writable so `JSON.parse` can fail. Attribution is best-effort — a bad
 * record must never block a checkout.
 *
 * @return {{type: string, id: string, ts: number}|null} The record, or null.
 */
export function readCtaAttribution() {
	let raw;
	try {
		raw = window.sessionStorage.getItem( STORAGE_KEY );
	} catch ( e ) {
		return null;
	}
	if ( ! raw ) {
		return null;
	}
	let record;
	try {
		record = JSON.parse( raw );
	} catch ( e ) {
		return null;
	}
	// Reject records written by a different schema version (drift fail-safe).
	if ( ! record || record.v !== SCHEMA || ! FIELD_BY_TYPE[ record.type ] || ! record.id ) {
		return null;
	}
	// Session-scoped AND time-bounded (NPPD-1887 product decision). A reader who clicks
	// the CTA, wanders off, and converts two hours later in the same tab gets no credit.
	if ( 'number' !== typeof record.ts || Date.now() - record.ts > TTL_MS ) {
		return null;
	}
	return record;
}

/**
 * Inject the persisted surface id into a checkout/donate form, if it needs one.
 *
 * Two guards, both load-bearing:
 *
 *   1. A form that ALREADY carries the field wins. That is a form rendered inside the
 *      gate or prompt itself, whose id was stamped server-side (prompts) or by
 *      `gate.js::addFormInputs()` (gates). A replayed value must never overwrite the
 *      surface the reader is actually looking at. Same precedence rule that
 *      `copyContextFields()` applies to PICKER_CONTEXT_FIELDS.
 *
 *   2. A form inside a gate is never replayed into. `gate.js` owns attribution there,
 *      and it binds on the gate's 'seen' event — which may not have fired yet when
 *      this runs. Without this guard, a stale id from a gate on a PREVIOUS page could
 *      beat the current page's gate to the field.
 *
 * Called from the submit handler rather than at DOM-ready, so it observes the final
 * state of the form after every other script has had its turn.
 *
 * @param {HTMLFormElement} form The form about to be submitted.
 *
 * @return {boolean} Whether a field was injected.
 */
export function applyCtaAttribution( form ) {
	if ( ! form || 'function' !== typeof form.querySelector ) {
		return false;
	}
	if ( form.closest( '.newspack-content-gate__gate' ) ) {
		return false;
	}
	const record = readCtaAttribution();
	if ( ! record ) {
		return false;
	}
	const name = FIELD_BY_TYPE[ record.type ];
	if ( form.querySelector( `input[name="${ name }"]` ) ) {
		return false;
	}
	const input = document.createElement( 'input' );
	input.type = 'hidden';
	input.name = name;
	input.value = record.id;
	form.prepend( input );
	return true;
}
