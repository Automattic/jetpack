import { describe, expect, jest, test, beforeEach } from '@jest/globals';

// Captures what the component passes to useBlockProps / WithNotchedWrapper.
let blockPropsArg;

// The fake block-editor store the mocked useSelect runs mapSelect against.
let fakeBlocks;

const LABEL_CLIENT_ID = 'label-client-id';
const FIELD_CLIENT_ID = 'field-client-id';

await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	RichText: jest.fn( () => null ),
	store: 'core/block-editor',
	useBlockProps: jest.fn( args => {
		blockPropsArg = args;
		return args;
	} ),
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	// Run the real mapSelect against a fake `select` so the hooks under test
	// (useFieldContext in particular) actually execute.
	useSelect: jest.fn( mapSelect =>
		mapSelect( () => ( {
			getBlockRootClientId: clientId => ( clientId === LABEL_CLIENT_ID ? FIELD_CLIENT_ID : null ),
			getBlock: clientId => fakeBlocks[ clientId ],
			getSettings: () => ( { isPreviewMode: false } ),
		} ) )
	),
} ) );

await jest.unstable_mockModule( '@wordpress/element', () => ( {
	useCallback: jest.fn( fn => fn ),
} ) );

await jest.unstable_mockModule( '@wordpress/i18n', () => ( {
	__: jest.fn( str => str ),
} ) );

await jest.unstable_mockModule( '../../shared/hooks/use-synced-attributes.jsx', () => ( {
	useSyncedAttributes: jest.fn(),
} ) );

await jest.unstable_mockModule( '../../shared/hooks/use-variation-style-properties.js', () => ( {
	default: jest.fn( () => ( {} ) ),
} ) );

const LabelEdit = ( await import( '../edit.jsx' ) ).default;

/**
 * Builds the parent field block returned by the fake store.
 *
 * @param {string} fieldName - The parent field block name.
 * @param {string} inputName - The inner input block name.
 */
const setParentField = ( fieldName, inputName ) => {
	fakeBlocks = {
		[ FIELD_CLIENT_ID ]: {
			name: fieldName,
			innerBlocks: [ { name: inputName, attributes: {} } ],
		},
	};
};

/**
 * Invokes the label block and returns the className it computed.
 *
 * @param {string} formClassName - The parent form's className attribute.
 * @return {string} The className passed to useBlockProps.
 */
const getLabelClassName = formClassName => {
	blockPropsArg = undefined;
	LabelEdit( {
		clientId: LABEL_CLIENT_ID,
		name: 'jetpack/label',
		attributes: { label: 'How happy are you?', placeholder: '', requiredText: '' },
		setAttributes: jest.fn(),
		context: {
			'jetpack/form-class-name': formClassName,
			'jetpack/field-required': false,
			'jetpack/field-date-format': undefined,
			'jetpack/field-share-attributes': false,
		},
	} );
	return blockPropsArg.className;
};

describe( 'LabelEdit inset label classes', () => {
	beforeEach( () => {
		setParentField( 'jetpack/field-name', 'jetpack/input' );
	} );

	test.each( [
		[ 'is-style-outlined', 'notched-label__label' ],
		[ 'is-style-animated', 'animated-label__label' ],
	] )( 'a text field gets its inset label under %s', ( formClassName, expectedClass ) => {
		expect( getLabelClassName( formClassName ) ).toContain( expectedClass );
	} );

	test.each( [ [ 'is-style-outlined' ], [ 'is-style-animated' ] ] )(
		'the slider field gets no inset label under %s',
		formClassName => {
			setParentField( 'jetpack/field-slider', 'jetpack/input-range' );

			const className = getLabelClassName( formClassName );

			expect( className ).not.toContain( 'notched-label__label' );
			expect( className ).not.toContain( 'animated-label__label' );
			expect( className ).toContain( 'jetpack-field-label' );
		}
	);

	test( 'the slider field still gets the below label, which renders outside the field', () => {
		setParentField( 'jetpack/field-slider', 'jetpack/input-range' );

		expect( getLabelClassName( 'is-style-below' ) ).toContain( 'below-label__label' );
	} );

	test( 'the default form style adds no style-specific class', () => {
		const className = getLabelClassName( 'is-style-default' );

		expect( className ).toBe( 'jetpack-field-label' );
	} );
} );
