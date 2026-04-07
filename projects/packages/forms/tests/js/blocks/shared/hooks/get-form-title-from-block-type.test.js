import { describe, expect, jest, test, beforeEach } from '@jest/globals';

const mockGetBlockType = jest.fn();

await jest.unstable_mockModule( '@wordpress/blocks', () => ( {
	createBlock: jest.fn( ( blockName, attributes, innerBlocks ) => ( {
		name: blockName,
		attributes: attributes || {},
		innerBlocks: innerBlocks || [],
		clientId: `mock-${ blockName }`,
	} ) ),
	getBlockType: mockGetBlockType,
} ) );

await jest.unstable_mockModule( '@wordpress/i18n', () => ( {
	__: jest.fn( str => str ),
} ) );

await jest.unstable_mockModule( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	resolveSelect: jest.fn(),
	useDispatch: jest.fn( () => ( {} ) ),
	useSelect: jest.fn( () => ( {} ) ),
} ) );

await jest.unstable_mockModule( '@wordpress/editor', () => ( {
	store: 'core/editor',
} ) );

await jest.unstable_mockModule( '@wordpress/element', () => ( {
	useEffect: jest.fn(),
	useRef: jest.fn( () => ( { current: false } ) ),
} ) );

await jest.unstable_mockModule( '../../../../../src/hooks/use-config-value.ts', () => ( {
	default: jest.fn(),
} ) );

await jest.unstable_mockModule(
	'../../../../../src/blocks/contact-form/util/create-synced-form.ts',
	() => ( {
		createSyncedForm: jest.fn(),
	} )
);

const { getFormTitleFromBlockType } = await import(
	'../../../../../src/blocks/shared/hooks/use-form-wrapper.js'
);

describe( 'getFormTitleFromBlockType', () => {
	beforeEach( () => {
		mockGetBlockType.mockReset();
	} );

	test( 'returns the block type title when the block type is registered', () => {
		mockGetBlockType.mockReturnValue( { title: 'Name field' } );
		expect( getFormTitleFromBlockType( 'jetpack-forms/name' ) ).toBe( 'Name field' );
		expect( mockGetBlockType ).toHaveBeenCalledWith( 'jetpack-forms/name' );
	} );

	test( 'returns "Untitled" when the block type is not registered', () => {
		mockGetBlockType.mockReturnValue( undefined );
		expect( getFormTitleFromBlockType( 'jetpack-forms/unknown' ) ).toBe( 'Untitled' );
	} );

	test( 'returns "Untitled" when getBlockType returns null', () => {
		mockGetBlockType.mockReturnValue( null );
		expect( getFormTitleFromBlockType( 'jetpack-forms/name' ) ).toBe( 'Untitled' );
	} );

	test( 'returns "Untitled" when block type has no title property', () => {
		mockGetBlockType.mockReturnValue( { name: 'jetpack-forms/name' } );
		expect( getFormTitleFromBlockType( 'jetpack-forms/name' ) ).toBe( 'Untitled' );
	} );

	test( 'returns the correct title for different block types', () => {
		mockGetBlockType.mockReturnValue( { title: 'Email field' } );
		expect( getFormTitleFromBlockType( 'jetpack-forms/email' ) ).toBe( 'Email field' );

		mockGetBlockType.mockReturnValue( { title: 'Phone Number' } );
		expect( getFormTitleFromBlockType( 'jetpack-forms/phone' ) ).toBe( 'Phone Number' );
	} );
} );
