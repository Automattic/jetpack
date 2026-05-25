/**
 * FORMS-685 — onFormSubmit recovery path tests.
 *
 * These tests exercise `actions.onFormSubmit` from view.js directly to ensure
 * the Store↔DOM divergence recovery branch introduced in FORMS-685 is covered.
 *
 * Mocking strategy: `@wordpress/interactivity` is mocked so `store()` captures
 * the config and returns `{ state, actions }` directly; `getContext()` returns a
 * per-test mutable context object; `withSyncEvent` is a plain pass-through.
 * `./shared.ts` `submitForm` is mocked to resolve immediately. All other
 * side-effectful imports (field-rating/view, field-type-icons-view) are mocked
 * as no-ops so view.js can be imported in jsdom.
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';

// ── 1. Set up mocks BEFORE any dynamic imports ────────────────────────────────

/**
 * The single mutable context object the test controls.
 * All mock interactivity functions read/write via this reference.
 */
let testContext = null;

/**
 * Collected store configs (one per store() call in view.js and its deps).
 * We merge all into a single object so state getters and actions are accessible.
 */
const mergedStore = { state: {}, actions: {}, callbacks: {}, effects: {} };

const mockSubmitForm = jest.fn();

await jest.unstable_mockModule( '@wordpress/interactivity', () => ( {
	store: ( _namespace, config ) => {
		// Merge each slice as store() may be called multiple times (view.js, field-rating/view.js, field-type-icons-view.js).
		if ( config.state ) {
			Object.defineProperties(
				mergedStore.state,
				Object.getOwnPropertyDescriptors( config.state )
			);
		}
		if ( config.actions ) {
			Object.assign( mergedStore.actions, config.actions );
		}
		if ( config.callbacks ) {
			Object.assign( mergedStore.callbacks, config.callbacks );
		}
		// Return the merged store so view.js destructures { state, actions } correctly.
		return mergedStore;
	},
	getContext: () => testContext,
	getConfig: () => ( {
		error_types: {
			is_required: 'This field is required.',
			invalid_email: 'Invalid email.',
			invalid_form: 'Please fill out the form correctly.',
			invalid_form_empty: 'Please fill out the form.',
		},
	} ),
	getElement: () => ( { ref: null } ),
	withSyncEvent:
		cb =>
		( ...args ) =>
			cb( ...args ),
} ) );

await jest.unstable_mockModule( '../../../../src/modules/form/shared.ts', () => ( {
	submitForm: mockSubmitForm,
	focusNextInput: jest.fn(),
	dispatchSubmitEvent: jest.fn(),
} ) );

// field-rating/view.js calls store() too — the mock above handles it.
// field-type-icons-view.js similarly calls store() — handled.

// ── 2. Dynamically import view.js AFTER mocks are set up ─────────────────────

// (view.js side-effect import registers the store config into mergedStore)
await import( '../../../../src/modules/form/view.js' );

// ── 3. Helper to drive a generator to completion ──────────────────────────────

/**
 * Run a generator (possibly async yield) to completion.
 * Each yielded value is awaited; the resolved value is sent back via .next().
 *
 * @param {Generator} gen - The generator to drive.
 * @return {Promise<void>} Resolves when the generator is done.
 */
const driveGenerator = async gen => {
	let result = gen.next();
	while ( ! result.done ) {
		// Yield values are Promises (e.g. submitForm returns a Promise).
		const resolved = await Promise.resolve( result.value );
		result = gen.next( resolved );
	}
};

/**
 * Build a minimal fake submit event.
 *
 * @param {HTMLFormElement|null} formElement - The form element to set as event.target.
 * @return {object} Fake event object.
 */
const makeFakeEvent = ( formElement = null ) => ( {
	target: formElement,
	preventDefault: jest.fn(),
	stopPropagation: jest.fn(),
} );

// ── 4. Tests ──────────────────────────────────────────────────────────────────

describe( 'FORMS-685 — onFormSubmit recovery path (Store↔DOM divergence)', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		document.body.innerHTML = '';
		mockSubmitForm.mockResolvedValue( { success: true, data: [] } );
	} );

	test( 'recovery path: store empty but DOM filled → reconcile recovers value, form submits via AJAX', async () => {
		// Build a jsdom form with a filled text input.
		const form = document.createElement( 'form' );
		form.id = 'jp-form-testhash';
		form.innerHTML = '<input type="text" name="name" value="Alice" />';
		document.body.appendChild( form );

		// Context: store thinks the field is empty (store capture was suppressed in Safari).
		testContext = {
			fields: {
				name: {
					id: 'name',
					type: 'text',
					label: 'Name',
					value: '',
					isRequired: true,
					extra: null,
					error: 'is_required', // ← what validateField('text', '', true) returns
					showFieldError: false,
					step: 1,
					isOtherSelected: false,
					otherLabel: null,
				},
			},
			showErrors: false,
			isSubmitting: false,
			submissionSuccess: false,
			submissionError: null,
			useAjax: true,
			formHash: 'testhash',
			isMultiStep: false,
			elementId: 'jp-form-testhash',
		};

		const event = makeFakeEvent( form );

		// Drive the generator — should NOT block; should call submitForm.
		const gen = mergedStore.actions.onFormSubmit( event );
		await driveGenerator( gen );

		// The recovery path found 'Alice' in the DOM, re-validated as valid,
		// then let submission proceed.
		expect( mockSubmitForm ).toHaveBeenCalledWith( 'testhash' );
		// showErrors must NOT have been set to true (that only happens on genuine block).
		expect( testContext.showErrors ).toBe( false );
	} );

	test( 'genuine-empty path: store empty AND DOM empty → blocks, submitForm never called', async () => {
		// Build a jsdom form with an unfilled required input.
		const form = document.createElement( 'form' );
		form.id = 'jp-form-emptyhash';
		form.innerHTML = '<input type="text" name="username" value="" />';
		document.body.appendChild( form );

		// Context: store thinks field is empty AND DOM is also empty.
		testContext = {
			fields: {
				username: {
					id: 'username',
					type: 'text',
					label: 'Username',
					value: '',
					isRequired: true,
					extra: null,
					error: 'is_required',
					showFieldError: false,
					step: 1,
					isOtherSelected: false,
					otherLabel: null,
				},
			},
			showErrors: false,
			isSubmitting: false,
			submissionSuccess: false,
			submissionError: null,
			useAjax: true,
			formHash: 'emptyhash',
			isMultiStep: false,
			elementId: 'jp-form-emptyhash',
		};

		const event = makeFakeEvent( form );

		const gen = mergedStore.actions.onFormSubmit( event );
		await driveGenerator( gen );

		// The form was genuinely empty — must have blocked.
		expect( mockSubmitForm ).not.toHaveBeenCalled();
		expect( testContext.showErrors ).toBe( true );
		expect( event.preventDefault ).toHaveBeenCalled();
	} );

	test( 'DOM-direct: recovery uses isFormValidFromDom — store re-read NOT used for decision', async () => {
		// Even if updateField() fails to persist (as happens under Safari protection),
		// the DOM-direct path should still proceed because it reads DOM, not store.
		// We simulate this by: store empty, DOM filled with valid email.
		const form = document.createElement( 'form' );
		form.id = 'jp-form-ddrect';
		form.innerHTML = '<input type="email" name="em" value="user@example.com" />';
		document.body.appendChild( form );

		testContext = {
			fields: {
				em: {
					id: 'em',
					type: 'email',
					label: 'Email',
					value: '',
					isRequired: true,
					extra: null,
					error: 'is_required',
					showFieldError: false,
					step: 1,
					isOtherSelected: false,
					otherLabel: null,
				},
			},
			showErrors: false,
			isSubmitting: false,
			submissionSuccess: false,
			submissionError: null,
			useAjax: true,
			formHash: 'ddrect',
			isMultiStep: false,
			elementId: 'jp-form-ddrect',
		};

		const event = makeFakeEvent( form );
		const gen = mergedStore.actions.onFormSubmit( event );
		await driveGenerator( gen );

		// DOM-direct check found a valid email → form proceeds.
		expect( mockSubmitForm ).toHaveBeenCalledWith( 'ddrect' );
		// Note: useAjax=true always calls preventDefault() to prevent native form
		// submission and use AJAX instead — this is expected and correct behaviour.
		// The key signal is that submitForm was called (not blocked).
	} );

	test( 'radio field: DOM selection filled, store empty → recovery proceeds', async () => {
		const form = document.createElement( 'form' );
		form.id = 'jp-form-radiohash';
		form.innerHTML = `
			<fieldset>
				<input type="radio" name="plan" value="basic" />
				<input type="radio" name="plan" value="pro" checked />
			</fieldset>
		`;
		document.body.appendChild( form );

		testContext = {
			fields: {
				plan: {
					id: 'plan',
					type: 'radio',
					label: 'Plan',
					value: '',
					isRequired: true,
					extra: null,
					error: 'is_required',
					showFieldError: false,
					step: 1,
					isOtherSelected: false,
					otherLabel: null,
				},
			},
			showErrors: false,
			isSubmitting: false,
			submissionSuccess: false,
			submissionError: null,
			useAjax: true,
			formHash: 'radiohash',
			isMultiStep: false,
			elementId: 'jp-form-radiohash',
		};

		const event = makeFakeEvent( form );
		const gen = mergedStore.actions.onFormSubmit( event );
		await driveGenerator( gen );

		expect( mockSubmitForm ).toHaveBeenCalledWith( 'radiohash' );
		expect( testContext.showErrors ).toBe( false );
	} );

	test( 'mixed: text filled + rating valid in store → recovery proceeds', async () => {
		// rating is unreadable → isFormValidFromDom falls back to field.error='yes'
		const form = document.createElement( 'form' );
		form.id = 'jp-form-mixedhash';
		form.innerHTML = `
			<input type="text" name="name" value="Alice" />
			<input type="hidden" name="stars" value="4/5" />
		`;
		document.body.appendChild( form );

		testContext = {
			fields: {
				name: {
					id: 'name',
					type: 'text',
					label: 'Name',
					value: '',
					isRequired: true,
					extra: null,
					error: 'is_required',
					showFieldError: false,
					step: 1,
					isOtherSelected: false,
					otherLabel: null,
				},
				stars: {
					id: 'stars',
					type: 'rating',
					label: 'Rating',
					value: '',
					isRequired: true,
					extra: null,
					error: 'yes', // ← store has valid rating captured via separate mechanism
					showFieldError: false,
					step: 1,
					isOtherSelected: false,
					otherLabel: null,
				},
			},
			showErrors: false,
			isSubmitting: false,
			submissionSuccess: false,
			submissionError: null,
			useAjax: true,
			formHash: 'mixedhash',
			isMultiStep: false,
			elementId: 'jp-form-mixedhash',
		};

		const event = makeFakeEvent( form );
		const gen = mergedStore.actions.onFormSubmit( event );
		await driveGenerator( gen );

		expect( mockSubmitForm ).toHaveBeenCalledWith( 'mixedhash' );
		expect( testContext.showErrors ).toBe( false );
	} );

	test( 'mixed: text filled + rating missing in store → recovery blocks', async () => {
		const form = document.createElement( 'form' );
		form.id = 'jp-form-ratingmiss';
		form.innerHTML = `
			<input type="text" name="name" value="Alice" />
			<input type="hidden" name="stars" value="" />
		`;
		document.body.appendChild( form );

		testContext = {
			fields: {
				name: {
					id: 'name',
					type: 'text',
					label: 'Name',
					value: '',
					isRequired: true,
					extra: null,
					error: 'is_required',
					showFieldError: false,
					step: 1,
					isOtherSelected: false,
					otherLabel: null,
				},
				stars: {
					id: 'stars',
					type: 'rating',
					label: 'Rating',
					value: '',
					isRequired: true,
					extra: null,
					error: 'is_required', // ← rating genuinely not set
					showFieldError: false,
					step: 1,
					isOtherSelected: false,
					otherLabel: null,
				},
			},
			showErrors: false,
			isSubmitting: false,
			submissionSuccess: false,
			submissionError: null,
			useAjax: true,
			formHash: 'ratingmiss',
			isMultiStep: false,
			elementId: 'jp-form-ratingmiss',
		};

		const event = makeFakeEvent( form );
		const gen = mergedStore.actions.onFormSubmit( event );
		await driveGenerator( gen );

		expect( mockSubmitForm ).not.toHaveBeenCalled();
		expect( testContext.showErrors ).toBe( true );
		expect( event.preventDefault ).toHaveBeenCalled();
	} );

	test( 'multistep: step-1 fields filled in DOM → recovery proceeds on step 1', async () => {
		const form = document.createElement( 'form' );
		form.id = 'jp-form-mshash';
		form.innerHTML = `
			<input type="text" name="name" value="Alice" />
			<input type="email" name="email" value="" />
		`;
		document.body.appendChild( form );

		// step 1 has 'name'; step 2 has 'email' (empty but not current step).
		testContext = {
			fields: {
				name: {
					id: 'name',
					type: 'text',
					label: 'Name',
					value: '',
					isRequired: true,
					extra: null,
					error: 'is_required',
					showFieldError: false,
					step: 1,
					isOtherSelected: false,
					otherLabel: null,
				},
				email: {
					id: 'email',
					type: 'email',
					label: 'Email',
					value: '',
					isRequired: true,
					extra: null,
					error: 'is_required',
					showFieldError: false,
					step: 2,
					isOtherSelected: false,
					otherLabel: null,
				},
			},
			showErrors: false,
			isSubmitting: false,
			submissionSuccess: false,
			submissionError: null,
			useAjax: false, // native POST for multistep to avoid submitForm complexity
			formHash: 'mshash',
			isMultiStep: true,
			currentStep: 1,
			maxSteps: 2,
			elementId: 'jp-form-mshash',
		};

		const event = makeFakeEvent( form );
		const gen = mergedStore.actions.onFormSubmit( event );
		await driveGenerator( gen );

		// DOM-direct says step 1 is valid → recovery proceeds (advances step, doesn't block).
		// The multistep branch increments currentStep and returns, so submitForm is not called yet.
		expect( testContext.showErrors ).toBe( false );
	} );

	test( 'happy path: state.isFormValid already true → recovery never runs, submitForm called directly', async () => {
		const form = document.createElement( 'form' );
		form.id = 'jp-form-happy';
		form.innerHTML = '<input type="text" name="name" value="Bob" />';
		document.body.appendChild( form );

		testContext = {
			fields: {
				name: {
					id: 'name',
					type: 'text',
					label: 'Name',
					value: 'Bob',
					isRequired: true,
					extra: null,
					error: 'yes', // ← store already valid (normal path, Safari not involved)
					showFieldError: false,
					step: 1,
					isOtherSelected: false,
					otherLabel: null,
				},
			},
			showErrors: false,
			isSubmitting: false,
			submissionSuccess: false,
			submissionError: null,
			useAjax: true,
			formHash: 'happy',
			isMultiStep: false,
			elementId: 'jp-form-happy',
		};

		const event = makeFakeEvent( form );
		const gen = mergedStore.actions.onFormSubmit( event );
		await driveGenerator( gen );

		// Happy path: submitForm called without going through the recovery block.
		expect( mockSubmitForm ).toHaveBeenCalledWith( 'happy' );
		// Note: useAjax=true always calls preventDefault() for AJAX submission.
		expect( testContext.showErrors ).toBe( false );
	} );
} );
