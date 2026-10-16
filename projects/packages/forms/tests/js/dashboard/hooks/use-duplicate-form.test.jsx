/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

const getEntityRecord = jest.fn();
const saveEntityRecord = jest.fn();
const createSuccessNotice = jest.fn();
const createErrorNotice = jest.fn();
const invalidateFormStatusCounts = jest.fn();

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	resolveSelect: () => ( { getEntityRecord } ),
	useDispatch: store => {
		if ( store === 'core' ) {
			return { saveEntityRecord };
		}
		if ( store === 'notices' ) {
			return { createSuccessNotice, createErrorNotice };
		}
		return { invalidateFormStatusCounts };
	},
} ) );
await jest.unstable_mockModule( '@wordpress/notices', () => ( { store: 'notices' } ) );
await jest.unstable_mockModule( '../../../../src/dashboard/store/index.js', () => ( {
	store: 'dashboard',
} ) );
await jest.unstable_mockModule( '../../../../src/hooks/use-config-value', () => ( {
	default: () => 'http://example.com/wp-admin/',
} ) );

const { default: useDuplicateForm } =
	await import( '../../../../src/dashboard/wp-build/hooks/use-duplicate-form' );

describe( 'useDuplicateForm', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		getEntityRecord.mockResolvedValue( { content: { raw: '<!-- form -->' }, status: 'publish' } );
		saveEntityRecord.mockResolvedValue( { id: 99 } );
	} );

	it( 'loads the original form without a query', async () => {
		const { result } = renderHook( () => useDuplicateForm() );

		await act( () => result.current.duplicateForm( { id: 42, title: 'Contact' } ) );

		// A query here leaves core-data a cache entry that breaks later form deletes.
		expect( getEntityRecord ).toHaveBeenCalledWith( 'postType', 'jetpack_form', 42 );
	} );

	it( 'saves a draft copy of the original content', async () => {
		const { result } = renderHook( () => useDuplicateForm() );

		await act( () => result.current.duplicateForm( { id: 42, title: 'Contact' } ) );

		expect( saveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'jetpack_form',
			expect.objectContaining( {
				title: 'Contact Copy',
				content: '<!-- form -->',
				status: 'draft',
			} ),
			{ throwOnError: true }
		);
		expect( createSuccessNotice ).toHaveBeenCalled();
	} );
} );
