import { describe, expect, jest, test, beforeEach } from '@jest/globals';

const store = jest.fn();
const getElement = jest.fn();
const getContext = jest.fn();

// Native-ESM Jest: `jest.mock()` cannot hoist, so mock the registry and import
// the subject afterwards.
jest.unstable_mockModule( '@wordpress/interactivity', () => ( { store, getElement, getContext } ) );

await import( '../../../../src/modules/form/field-type-icons-view.js' );
const { getFieldTypeIconHtml, getFieldTypeIconKey } = await import(
	'../../../../src/modules/form/field-type-icons.js'
);

const { watchFieldTypeIcon } = store.mock.calls[ 0 ][ 1 ].callbacks;

/**
 * Drive the callback with a fake element and submission.
 *
 * @param {object} ref        - Stand-in for the icon container element.
 * @param {object} submission - The submission context.
 * @return {object} The ref, after the callback ran.
 */
const run = ( ref, submission ) => {
	getElement.mockReturnValue( { ref } );
	getContext.mockReturnValue( { submission } );
	watchFieldTypeIcon();
	return ref;
};

describe( 'watchFieldTypeIcon', () => {
	beforeEach( () => {
		getElement.mockReset();
		getContext.mockReset();
	} );

	test( 'does nothing without an element', () => {
		getElement.mockReturnValue( { ref: null } );
		getContext.mockReturnValue( { submission: { type: 'text' } } );

		expect( () => watchFieldTypeIcon() ).not.toThrow();
	} );

	test( 'renders the icon for an AJAX submission', () => {
		const ref = run( { innerHTML: '', dataset: {} }, { type: 'checkbox', rawValue: 'Yes' } );

		expect( ref.dataset.renderedType ).toBe( 'checkbox' );
		expect( ref.innerHTML ).toBe( getFieldTypeIconHtml( 'checkbox', 'Yes' ) );
	} );

	test( 'keeps a server-rendered icon whose key already matches', () => {
		const ref = run(
			{ innerHTML: '<svg data-server-rendered />', dataset: { renderedType: 'checkbox' } },
			{ type: 'checkbox', rawValue: 'Yes' }
		);

		expect( ref.innerHTML ).toBe( '<svg data-server-rendered />' );
	} );

	test( 're-renders when the answer changes the icon but not the field type', () => {
		// The guard compares the icon key, not the field type: an unchecked
		// checkbox must not inherit a ticked icon left over from a previous render.
		const ref = run(
			{ innerHTML: '<svg data-stale />', dataset: { renderedType: 'checkbox' } },
			{ type: 'checkbox', rawValue: '' }
		);

		expect( ref.dataset.renderedType ).toBe( 'checkbox:unchecked' );
		expect( ref.innerHTML ).toBe( getFieldTypeIconHtml( 'checkbox', '' ) );
		expect( getFieldTypeIconKey( 'checkbox', '' ) ).toBe( 'checkbox:unchecked' );
	} );

	/**
	 * The printed label is localized; the answer is not. `isCheckedValue()` recognizes only
	 * the ASCII `no` sentinel, so keying the icon off the label rendered the ticked box beside
	 * the word for "no" in every locale whose word for it is not "no".
	 */
	test( 'keys off the submitted answer, not the localized label', () => {
		const ref = run(
			{ innerHTML: '', dataset: {} },
			{ type: 'checkbox', value: 'Non', rawValue: '' }
		);

		expect( ref.dataset.renderedType ).toBe( 'checkbox:unchecked' );
	} );

	test( 'falls back to the text icon when the submission has no type', () => {
		const ref = run( { innerHTML: '', dataset: {} }, {} );

		expect( ref.dataset.renderedType ).toBe( 'text' );
	} );
} );
