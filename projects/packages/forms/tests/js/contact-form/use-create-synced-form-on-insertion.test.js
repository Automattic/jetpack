/**
 * Tests for useCreateSyncedFormOnInsertion hook
 */

import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';

// Mock dependencies
const mockCreateSyncedForm = jest.fn();
const mockCreateSuccessNotice = jest.fn();
const mockCreateErrorNotice = jest.fn();
const mockSetAttributes = jest.fn();
const mockBatch = jest.fn( callback => callback() );
let mockHasFeatureFlag = true;
let mockCurrentPostType = 'post';
let mockCurrentPostId = 123;

await jest.unstable_mockModule( '@automattic/jetpack-shared-extension-utils', () => ( {
	hasFeatureFlag: flag => {
		if ( flag === 'central-form-management' ) {
			return mockHasFeatureFlag;
		}
		return false;
	},
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

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useSelect: selector => {
		// The selector function expects to receive a `select` function
		// that takes a store name and returns selectors for that store
		const select = () => ( {
			getCurrentPostType: () => mockCurrentPostType,
			getCurrentPostId: () => mockCurrentPostId,
		} );
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
	useRegistry: () => ( {
		batch: mockBatch,
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

await jest.unstable_mockModule( '../../../src/blocks/contact-form/variations.js', () => ( {
	default: [
		{
			name: 'contact-form',
			title: 'Contact Form',
			attributes: { variationName: 'default' },
		},
		{
			name: 'feedback-form',
			title: 'Feedback Form',
			attributes: {},
		},
		{
			name: 'appointment-form',
			title: 'Appointment Form',
			attributes: {},
		},
		{
			name: 'rsvp-form',
			title: 'RSVP Form',
			attributes: {},
		},
		{
			name: 'registration-form',
			title: 'Registration Form',
			attributes: {},
		},
		{
			name: 'lead-capture-form',
			title: 'Lead capture',
			attributes: {},
		},
	],
} ) );

const { useCreateSyncedFormOnInsertion } = await import(
	'../../../src/blocks/contact-form/hooks/use-create-synced-form-on-insertion.ts'
);

describe( 'useCreateSyncedFormOnInsertion', () => {
	const defaultProps = {
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
		mockCreateSyncedForm.mockResolvedValue( 42 );
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

		// Wait a bit to ensure no async calls
		await new Promise( resolve => setTimeout( resolve, 100 ) );

		expect( mockCreateSyncedForm ).not.toHaveBeenCalled();
	} );

	it( 'does not create synced form if no inner blocks', async () => {
		const propsWithoutInnerBlocks = { ...defaultProps, innerBlocks: [] };

		renderHook( () => useCreateSyncedFormOnInsertion( propsWithoutInnerBlocks ) );

		// Wait a bit to ensure no async calls
		await new Promise( resolve => setTimeout( resolve, 100 ) );

		expect( mockCreateSyncedForm ).not.toHaveBeenCalled();
	} );

	it( 'does not create synced form when editing a jetpack_form post', async () => {
		mockCurrentPostType = 'jetpack_form';

		renderHook( () => useCreateSyncedFormOnInsertion( defaultProps ) );

		// Wait a bit to ensure no async calls
		await new Promise( resolve => setTimeout( resolve, 100 ) );

		expect( mockCreateSyncedForm ).not.toHaveBeenCalled();
	} );

	it( 'does not create synced form when central form management is disabled', async () => {
		mockHasFeatureFlag = false;

		renderHook( () => useCreateSyncedFormOnInsertion( defaultProps ) );

		// Wait a bit to ensure no async calls
		await new Promise( resolve => setTimeout( resolve, 100 ) );

		expect( mockCreateSyncedForm ).not.toHaveBeenCalled();
	} );

	it( 'only attempts to create synced form once', async () => {
		const { rerender } = renderHook( props => useCreateSyncedFormOnInsertion( props ), {
			initialProps: defaultProps,
		} );

		await waitFor( () => {
			expect( mockCreateSyncedForm ).toHaveBeenCalledTimes( 1 );
		} );

		// Rerender with same props
		rerender( defaultProps );

		// Wait a bit and verify it wasn't called again
		await new Promise( resolve => setTimeout( resolve, 100 ) );

		expect( mockCreateSyncedForm ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'shows error notice when synced form creation fails', async () => {
		mockCreateSyncedForm.mockRejectedValue( new Error( 'Failed to create' ) );

		// Suppress the console.error from the rejected promise
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

	it( 'identifies feedback form by rating field', async () => {
		const feedbackProps = {
			...defaultProps,
			innerBlocks: [
				{ name: 'jetpack/field-name', innerBlocks: [] },
				{ name: 'jetpack/field-email', innerBlocks: [] },
				{ name: 'jetpack/field-rating', innerBlocks: [] },
				{ name: 'core/button', innerBlocks: [] },
			],
			attributes: {},
		};

		renderHook( () => useCreateSyncedFormOnInsertion( feedbackProps ) );

		await waitFor( () => {
			expect( mockCreateSyncedForm ).toHaveBeenCalledWith(
				expect.anything(),
				'Feedback Form',
				expect.anything()
			);
		} );
	} );

	it( 'identifies appointment form by date field', async () => {
		const appointmentProps = {
			...defaultProps,
			innerBlocks: [
				{ name: 'jetpack/field-name', innerBlocks: [] },
				{ name: 'jetpack/field-email', innerBlocks: [] },
				{ name: 'jetpack/field-date', innerBlocks: [] },
				{ name: 'core/button', innerBlocks: [] },
			],
			attributes: {},
		};

		renderHook( () => useCreateSyncedFormOnInsertion( appointmentProps ) );

		await waitFor( () => {
			expect( mockCreateSyncedForm ).toHaveBeenCalledWith(
				expect.anything(),
				'Appointment Form',
				expect.anything()
			);
		} );
	} );

	it( 'identifies RSVP form by radio field without phone', async () => {
		const rsvpProps = {
			...defaultProps,
			innerBlocks: [
				{ name: 'jetpack/field-name', innerBlocks: [] },
				{ name: 'jetpack/field-email', innerBlocks: [] },
				{ name: 'jetpack/field-radio', innerBlocks: [] },
				{ name: 'core/button', innerBlocks: [] },
			],
			attributes: {},
		};

		renderHook( () => useCreateSyncedFormOnInsertion( rsvpProps ) );

		await waitFor( () => {
			expect( mockCreateSyncedForm ).toHaveBeenCalledWith(
				expect.anything(),
				'RSVP Form',
				expect.anything()
			);
		} );
	} );

	it( 'identifies registration form by phone and select fields', async () => {
		const registrationProps = {
			...defaultProps,
			innerBlocks: [
				{ name: 'jetpack/field-name', innerBlocks: [] },
				{ name: 'jetpack/field-email', innerBlocks: [] },
				{ name: 'jetpack/field-telephone', innerBlocks: [] },
				{ name: 'jetpack/field-select', innerBlocks: [] },
				{ name: 'core/button', innerBlocks: [] },
			],
			attributes: {},
		};

		renderHook( () => useCreateSyncedFormOnInsertion( registrationProps ) );

		await waitFor( () => {
			expect( mockCreateSyncedForm ).toHaveBeenCalledWith(
				expect.anything(),
				'Registration Form',
				expect.anything()
			);
		} );
	} );

	it( 'identifies lead capture form by consent field', async () => {
		const leadCaptureProps = {
			...defaultProps,
			innerBlocks: [
				{ name: 'jetpack/field-name', innerBlocks: [] },
				{ name: 'jetpack/field-email', innerBlocks: [] },
				{ name: 'jetpack/field-consent', innerBlocks: [] },
				{ name: 'core/button', innerBlocks: [] },
			],
			attributes: {},
		};

		renderHook( () => useCreateSyncedFormOnInsertion( leadCaptureProps ) );

		await waitFor( () => {
			expect( mockCreateSyncedForm ).toHaveBeenCalledWith(
				expect.anything(),
				'Lead capture',
				expect.anything()
			);
		} );
	} );
} );
