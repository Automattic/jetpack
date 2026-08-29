import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';

const updateBlockAttributes = jest.fn();
const markNextChangeAsNotPersistent = jest.fn();

await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent: markNextChangeAsNotPersistent,
	} ),
} ) );

// Standing in for the real predicate keeps this test about the hook's decision,
// not about which blocks child-blocks.js happens to register.
await jest.unstable_mockModule( '../../../util/get-input-fields.ts', () => ( {
	getInputFields: blocks =>
		( blocks || [] ).flatMap( block =>
			block.name === 'jetpack/field-email' || block.name === 'jetpack/field-name' ? [ block ] : []
		),
} ) );

const { default: useSingleInputFieldRequired } = await import(
	'../use-single-input-field-required.js'
);

const field = ( name, clientId, attributes = {} ) => ( { name, clientId, attributes } );

describe( 'useSingleInputFieldRequired', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'makes a lone optional field required', () => {
		renderHook( () =>
			useSingleInputFieldRequired( {
				innerBlocks: [ field( 'jetpack/field-email', 'email-1' ), field( 'core/button', 'btn' ) ],
			} )
		);

		expect( updateBlockAttributes ).toHaveBeenCalledTimes( 1 );
		expect( updateBlockAttributes ).toHaveBeenCalledWith( 'email-1', { required: true } );
	} );

	it( 'marks the change as not persistent so the entity stays clean', () => {
		renderHook( () =>
			useSingleInputFieldRequired( {
				innerBlocks: [ field( 'jetpack/field-email', 'email-1' ) ],
			} )
		);

		// The mark has to land before the write, or a one-field form opens its
		// post, template, or template part with unsaved changes nobody made.
		expect( markNextChangeAsNotPersistent ).toHaveBeenCalledTimes( 1 );
		expect( markNextChangeAsNotPersistent.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
			updateBlockAttributes.mock.invocationCallOrder[ 0 ]
		);
	} );

	it( 'leaves a lone field alone when it is already required', () => {
		renderHook( () =>
			useSingleInputFieldRequired( {
				innerBlocks: [ field( 'jetpack/field-email', 'email-1', { required: true } ) ],
			} )
		);

		expect( updateBlockAttributes ).not.toHaveBeenCalled();
		expect( markNextChangeAsNotPersistent ).not.toHaveBeenCalled();
	} );

	it( 'does nothing once a form has more than one field', () => {
		renderHook( () =>
			useSingleInputFieldRequired( {
				innerBlocks: [
					field( 'jetpack/field-name', 'name-1' ),
					field( 'jetpack/field-email', 'email-1' ),
				],
			} )
		);

		expect( updateBlockAttributes ).not.toHaveBeenCalled();
	} );

	it( 'does nothing for a form with no fields', () => {
		renderHook( () => useSingleInputFieldRequired( { innerBlocks: [] } ) );

		expect( updateBlockAttributes ).not.toHaveBeenCalled();
	} );
} );
