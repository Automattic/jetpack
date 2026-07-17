/**
 * Tests for useCreateSyncedFormOnInsertion hook
 */

import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock dependencies
const mockCreateSyncedForm = jest.fn();
const mockCreateSuccessNotice = jest.fn();
const mockCreateErrorNotice = jest.fn();
const mockSetAttributes = jest.fn();
const mockGetEntityRecord = jest.fn().mockResolvedValue( {} );
let mockHasFeatureFlag = true;
let mockCurrentPostType = 'post';
let mockCurrentPostId = 123;
let mockWasBlockJustInserted = true;

await jest.unstable_mockModule( '@automattic/jetpack-shared-extension-utils', () => ( {
	hasFeatureFlag: flag => {
		if ( flag === 'central-form-management' ) {
			return mockHasFeatureFlag;
		}
		return false;
	},
} ) );

await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );

await jest.unstable_mockModule( '@wordpress/blocks', () => ( {
	createBlock: ( name, attributes, innerBlocks ) => ( {
		name,
		attributes,
		innerBlocks,
	} ),
} ) );

await jest.unstable_mockModule( '@wordpress/editor', () => ( {
	store: 'core/editor',
} ) );

await jest.unstable_mockModule( '@wordpress/notices', () => ( {
	store: 'core/notices',
} ) );

await jest.unstable_mockModule( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useSelect: selector => {
		const select = store => {
			if ( store === 'core/editor' ) {
				return {
					getCurrentPostType: () => mockCurrentPostType,
					getCurrentPostId: () => mockCurrentPostId,
				};
			}
			if ( store === 'core/block-editor' ) {
				return {
					wasBlockJustInserted: () => mockWasBlockJustInserted,
				};
			}
			return {};
		};
		return selector( select );
	},
	useDispatch: store => {
		if ( store === 'core/notices' ) {
			return {
				createSuccessNotice: mockCreateSuccessNotice,
				createErrorNotice: mockCreateErrorNotice,
			};
		}
		return {};
	},
	resolveSelect: () => ( {
		getEntityRecord: mockGetEntityRecord,
	} ),
} ) );

await jest.unstable_mockModule( '@wordpress/i18n', () => ( {
	__: str => str,
} ) );

await jest.unstable_mockModule(
	'../../../src/blocks/contact-form/util/create-synced-form.ts',
	() => ( {
		createSyncedForm: mockCreateSyncedForm,
	} )
);

await jest.unstable_mockModule( '../../../src/blocks/shared/util/constants.js', () => ( {
	FORM_POST_TYPE: 'jetpack_form',
} ) );

await jest.unstable_mockModule( '../../../src/blocks/contact-form/variations.jsx', () => ( {
	default: [
		{
			name: 'contact-form',
			title: 'Contact Form',
			attributes: { variationName: 'default' },
		},
		{
			name: 'rsvp-form',
			title: 'RSVP Form',
			attributes: { variationName: 'rsvp-form' },
		},
	],
} ) );

const { useCreateSyncedFormOnInsertion } = await import(
	'../../../src/blocks/contact-form/hooks/use-create-synced-form-on-insertion.ts'
);

describe( 'useCreateSyncedFormOnInsertion', () => {
	const defaultProps = {
		clientId: 'test-client-id',
		ref: undefined,
		innerBlocks: [
			{ name: 'jetpack/field-name', innerBlocks: [] },
			{ name: 'jetpack/field-email', innerBlocks: [] },
			{ name: 'jetpack/field-textarea', innerBlocks: [] },
			{ name: 'core/button', innerBlocks: [] },
		],
		attributes: { variationName: 'default' },
		setAttributes: mockSetAttributes,
	};

	beforeEach( () => {
		jest.clearAllMocks();
		mockHasFeatureFlag = true;
		mockCurrentPostType = 'post';
		mockCurrentPostId = 123;
		mockWasBlockJustInserted = true;
		mockCreateSyncedForm.mockResolvedValue( 42 );
		mockGetEntityRecord.mockResolvedValue( {} );
	} );

	afterAll( () => {
		jest.restoreAllMocks();
	} );

	it( 'creates a synced form when a variation is inserted with inner blocks', async () => {
		renderHook( () => useCreateSyncedFormOnInsertion( defaultProps ) );

		await waitFor( () => {
			expect( mockCreateSyncedForm ).toHaveBeenCalled();
		} );

		expect( mockCreateSyncedForm ).toHaveBeenCalledWith(
			expect.objectContaining( {
				name: 'jetpack/contact-form',
				attributes: defaultProps.attributes,
				innerBlocks: defaultProps.innerBlocks,
			} ),
			'Contact Form',
			123
		);
	} );

	it( 'sets the ref attribute after creating synced form', async () => {
		renderHook( () => useCreateSyncedFormOnInsertion( defaultProps ) );

		await waitFor( () => {
			expect( mockSetAttributes ).toHaveBeenCalledWith( { ref: 42 } );
		} );
	} );

	it( 'shows success notice after creating synced form', async () => {
		renderHook( () => useCreateSyncedFormOnInsertion( defaultProps ) );

		await waitFor( () => {
			expect( mockCreateSuccessNotice ).toHaveBeenCalledWith(
				'New form created.',
				expect.objectContaining( { type: 'snackbar' } )
			);
		} );
	} );

	it( 'does not create synced form if ref already exists', async () => {
		const propsWithRef = { ...defaultProps, ref: 99 };

		renderHook( () => useCreateSyncedFormOnInsertion( propsWithRef ) );

		await act( () => Promise.resolve() );

		expect( mockCreateSyncedForm ).not.toHaveBeenCalled();
	} );

	it( 'does not create synced form if no inner blocks', async () => {
		const propsWithoutInnerBlocks = { ...defaultProps, innerBlocks: [] };

		renderHook( () => useCreateSyncedFormOnInsertion( propsWithoutInnerBlocks ) );

		await act( () => Promise.resolve() );

		expect( mockCreateSyncedForm ).not.toHaveBeenCalled();
	} );

	it( 'does not create synced form when editing a jetpack_form post', async () => {
		mockCurrentPostType = 'jetpack_form';

		renderHook( () => useCreateSyncedFormOnInsertion( defaultProps ) );

		await act( () => Promise.resolve() );

		expect( mockCreateSyncedForm ).not.toHaveBeenCalled();
	} );

	it( 'does not create synced form when central form management is disabled', async () => {
		mockHasFeatureFlag = false;

		renderHook( () => useCreateSyncedFormOnInsertion( defaultProps ) );

		await act( () => Promise.resolve() );

		expect( mockCreateSyncedForm ).not.toHaveBeenCalled();
	} );

	it( 'only attempts to create synced form once', async () => {
		const { rerender } = renderHook( props => useCreateSyncedFormOnInsertion( props ), {
			initialProps: defaultProps,
		} );

		await waitFor( () => {
			expect( mockCreateSyncedForm ).toHaveBeenCalledTimes( 1 );
		} );

		rerender( defaultProps );

		await act( () => Promise.resolve() );

		expect( mockCreateSyncedForm ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'shows error notice when synced form creation fails', async () => {
		mockCreateSyncedForm.mockRejectedValue( new Error( 'Failed to create' ) );

		const consoleSpy = jest.spyOn( console, 'error' ).mockImplementation( () => {} );

		renderHook( () => useCreateSyncedFormOnInsertion( defaultProps ) );

		await waitFor( () => {
			expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
				'Failed to create form. Using inline form instead.',
				expect.objectContaining( { type: 'snackbar' } )
			);
		} );

		consoleSpy.mockRestore();
	} );

	it( 'still sets ref when entity preload fails', async () => {
		mockGetEntityRecord.mockRejectedValue( new Error( 'Network error' ) );

		renderHook( () => useCreateSyncedFormOnInsertion( defaultProps ) );

		await waitFor( () => {
			expect( mockSetAttributes ).toHaveBeenCalledWith( { ref: 42 } );
		} );

		expect( mockCreateSuccessNotice ).toHaveBeenCalled();
		expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'does not create synced form when block was not just inserted', async () => {
		mockWasBlockJustInserted = false;

		renderHook( () => useCreateSyncedFormOnInsertion( defaultProps ) );

		await act( () => Promise.resolve() );

		expect( mockCreateSyncedForm ).not.toHaveBeenCalled();
	} );

	it( 'uses variation name to get form title', async () => {
		renderHook( () =>
			useCreateSyncedFormOnInsertion( {
				...defaultProps,
				attributes: { variationName: 'rsvp-form' },
			} )
		);

		await waitFor( () => {
			expect( mockCreateSyncedForm ).toHaveBeenCalledWith(
				expect.anything(),
				'RSVP Form',
				expect.anything()
			);
		} );
	} );

	it( 'does not create synced form when no variationName', async () => {
		renderHook( () =>
			useCreateSyncedFormOnInsertion( {
				...defaultProps,
				attributes: {},
			} )
		);

		await act( () => Promise.resolve() );

		expect( mockCreateSyncedForm ).not.toHaveBeenCalled();
	} );

	it( 'falls back to generic Form title when variationName does not match a variation', async () => {
		renderHook( () =>
			useCreateSyncedFormOnInsertion( {
				...defaultProps,
				attributes: { variationName: 'unknown-variation' },
			} )
		);

		await waitFor( () => {
			expect( mockCreateSyncedForm ).toHaveBeenCalledWith(
				expect.anything(),
				'Form',
				expect.anything()
			);
		} );
	} );
} );
