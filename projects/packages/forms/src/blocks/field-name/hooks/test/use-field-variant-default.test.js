import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';

const markNextChangeAsNotPersistent = jest.fn();

await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		__unstableMarkNextChangeAsNotPersistent: markNextChangeAsNotPersistent,
	} ),
} ) );

// variations.js pulls in an icon component and translations, neither of which
// this hook's behavior depends on.
await jest.unstable_mockModule( '../../variations.js', () => ( {
	FIRST_NAME_ID: 'first-name',
	LAST_NAME_ID: 'last-name',
	NAME_ID: 'name',
	isFirstNameVariationId: id => typeof id === 'string' && /^first-name(?:-\d+)?$/.test( id ),
	isLastNameVariationId: id => typeof id === 'string' && /^last-name(?:-\d+)?$/.test( id ),
} ) );

const { default: useFieldVariantDefault } = await import( '../use-field-variant-default.js' );

describe( 'useFieldVariantDefault', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it.each( [
		[ 'first-name', 'first-name' ],
		[ 'first-name-2', 'first-name' ],
		[ 'last-name', 'last-name' ],
		[ 'last-name-3', 'last-name' ],
		[ 'name', 'name' ],
		[ 'whatever-the-author-typed', 'name' ],
		[ undefined, 'name' ],
	] )( 'derives the variant %s from the stored id', ( id, expected ) => {
		const setAttributes = jest.fn();

		renderHook( () => useFieldVariantDefault( { id, fieldVariant: undefined, setAttributes } ) );

		expect( setAttributes ).toHaveBeenCalledWith( { fieldVariant: expected } );
	} );

	it( 'marks the backfill as not persistent so the entity stays clean', () => {
		const setAttributes = jest.fn();

		renderHook( () =>
			useFieldVariantDefault( { id: 'name', fieldVariant: undefined, setAttributes } )
		);

		expect( markNextChangeAsNotPersistent ).toHaveBeenCalledTimes( 1 );
		expect( markNextChangeAsNotPersistent.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
			setAttributes.mock.invocationCallOrder[ 0 ]
		);
	} );

	it( 'leaves a field that already has a variant alone', () => {
		const setAttributes = jest.fn();

		renderHook( () =>
			useFieldVariantDefault( { id: 'first-name', fieldVariant: 'last-name', setAttributes } )
		);

		expect( setAttributes ).not.toHaveBeenCalled();
		expect( markNextChangeAsNotPersistent ).not.toHaveBeenCalled();
	} );
} );
