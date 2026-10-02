/**
 * Tests for the CTA attribution replay (NPPD-1887).
 */

import { STORAGE_KEY, SCHEMA, TTL_MS, readCtaAttribution, applyCtaAttribution } from './cta-attribution';

/**
 * Write a raw value into sessionStorage.
 *
 * Object records are stamped with the current SCHEMA unless they specify their own `v`,
 * mirroring how persistCtaAttribution actually writes — so tests read realistic records,
 * while the version-mismatch test can still supply a drifted `v`.
 *
 * @param {*} value Value to store (stringified unless already a string).
 */
function store( value ) {
	if ( value && 'object' === typeof value && undefined === value.v ) {
		value = { v: SCHEMA, ...value };
	}
	window.sessionStorage.setItem( STORAGE_KEY, 'string' === typeof value ? value : JSON.stringify( value ) );
}

/**
 * Build a detached form, optionally with a pre-existing hidden input.
 *
 * @param {Object} options          Options.
 * @param {string} options.existing Name of a hidden input to pre-add.
 * @param {string} options.wrapper  Class name for a wrapping element.
 * @return {HTMLFormElement} The form (attached to document.body).
 */
function makeForm( { existing = null, wrapper = null } = {} ) {
	const form = document.createElement( 'form' );
	if ( existing ) {
		const input = document.createElement( 'input' );
		input.type = 'hidden';
		input.name = existing;
		input.value = 'original';
		form.appendChild( input );
	}
	if ( wrapper ) {
		const el = document.createElement( 'div' );
		el.className = wrapper;
		el.appendChild( form );
		document.body.appendChild( el );
	} else {
		document.body.appendChild( form );
	}
	return form;
}

describe( 'cta-attribution', () => {
	beforeEach( () => {
		window.sessionStorage.clear();
		document.body.innerHTML = '';
	} );

	describe( 'readCtaAttribution', () => {
		it( 'returns null when nothing is stored', () => {
			expect( readCtaAttribution() ).toBeNull();
		} );

		it( 'returns a fresh gate record', () => {
			store( { type: 'gate', id: '42', ts: Date.now() } );
			expect( readCtaAttribution() ).toEqual( { v: SCHEMA, type: 'gate', id: '42', ts: expect.any( Number ) } );
		} );

		// Drift fail-safe: the storage contract is duplicated across newspack-plugin and
		// newspack-blocks. A record written by a different schema version must be ignored,
		// not silently honored. (dkoo review, #575.)
		it( 'rejects a record written by a different schema version', () => {
			store( { v: SCHEMA + 1, type: 'gate', id: '42', ts: Date.now() } );
			expect( readCtaAttribution() ).toBeNull();
		} );

		it( 'rejects a record older than the TTL', () => {
			store( { type: 'gate', id: '42', ts: Date.now() - TTL_MS - 1000 } );
			expect( readCtaAttribution() ).toBeNull();
		} );

		it( 'accepts a record right at the TTL boundary', () => {
			store( { type: 'gate', id: '42', ts: Date.now() - TTL_MS + 5000 } );
			expect( readCtaAttribution() ).not.toBeNull();
		} );

		it( 'rejects an unknown surface type', () => {
			store( { type: 'banner', id: '42', ts: Date.now() } );
			expect( readCtaAttribution() ).toBeNull();
		} );

		it( 'rejects a record with no id', () => {
			store( { type: 'gate', ts: Date.now() } );
			expect( readCtaAttribution() ).toBeNull();
		} );

		it( 'rejects a non-numeric timestamp rather than treating it as fresh', () => {
			store( { type: 'gate', id: '42', ts: 'now' } );
			expect( readCtaAttribution() ).toBeNull();
		} );

		it( 'survives malformed JSON', () => {
			store( '{not json' );
			expect( readCtaAttribution() ).toBeNull();
		} );
	} );

	describe( 'applyCtaAttribution', () => {
		it( 'injects gate_post_id on a bare landing-page form', () => {
			store( { type: 'gate', id: '42', ts: Date.now() } );
			const form = makeForm();

			expect( applyCtaAttribution( form ) ).toBe( true );
			expect( form.querySelector( 'input[name="gate_post_id"]' ).value ).toBe( '42' );
		} );

		it( 'injects newspack_popup_id for a prompt record', () => {
			store( { type: 'prompt', id: '7', ts: Date.now() } );
			const form = makeForm();

			expect( applyCtaAttribution( form ) ).toBe( true );
			expect( form.querySelector( 'input[name="newspack_popup_id"]' ).value ).toBe( '7' );
		} );

		// Precedence: a form rendered inside the surface itself already carries the id,
		// stamped server-side (prompts) or by gate.js::addFormInputs (gates). A replayed
		// value must never overwrite the surface the reader is actually looking at.
		it( 'never overwrites an existing hidden input', () => {
			store( { type: 'gate', id: '42', ts: Date.now() } );
			const form = makeForm( { existing: 'gate_post_id' } );

			expect( applyCtaAttribution( form ) ).toBe( false );
			expect( form.querySelector( 'input[name="gate_post_id"]' ).value ).toBe( 'original' );
			expect( form.querySelectorAll( 'input[name="gate_post_id"]' ) ).toHaveLength( 1 );
		} );

		// gate.js owns attribution inside a gate, and it binds on the gate's 'seen'
		// event, which may not have fired yet. Without this guard a stale id from a gate
		// on a PREVIOUS page could beat the current page's gate to the field.
		it( 'never injects into a form inside a gate', () => {
			store( { type: 'gate', id: '42', ts: Date.now() } );
			const form = makeForm( { wrapper: 'newspack-content-gate__gate' } );

			expect( applyCtaAttribution( form ) ).toBe( false );
			expect( form.querySelector( 'input[name="gate_post_id"]' ) ).toBeNull();
		} );

		it( 'does nothing when the record is stale', () => {
			store( { type: 'gate', id: '42', ts: Date.now() - TTL_MS - 1 } );
			const form = makeForm();

			expect( applyCtaAttribution( form ) ).toBe( false );
			expect( form.querySelector( 'input[name="gate_post_id"]' ) ).toBeNull();
		} );

		it( 'does nothing when nothing is stored', () => {
			const form = makeForm();
			expect( applyCtaAttribution( form ) ).toBe( false );
		} );

		it( 'tolerates a missing form', () => {
			store( { type: 'gate', id: '42', ts: Date.now() } );
			expect( applyCtaAttribution( null ) ).toBe( false );
			expect( applyCtaAttribution( undefined ) ).toBe( false );
		} );
	} );
} );
