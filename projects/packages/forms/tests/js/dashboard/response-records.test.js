/**
 * External dependencies
 */
import { jest } from '@jest/globals';

const apiFetch = jest.fn( () => Promise.resolve( {} ) );

// Native-ESM Jest: `jest.mock()` cannot hoist here, so mock the module registry
// and import the subject afterwards.
jest.unstable_mockModule( '@wordpress/api-fetch', () => ( { default: apiFetch } ) );

const { deleteResponse, saveResponse } = await import(
	'../../../src/dashboard/response-records.ts'
);

describe( 'response records', () => {
	beforeEach( () => {
		apiFetch.mockClear();
	} );

	describe( 'saveResponse', () => {
		it( 'targets the feedback entity', async () => {
			const saveEntityRecord = jest.fn();

			await saveResponse( saveEntityRecord, { id: 17, status: 'spam' } );

			const [ kind, name, record ] = saveEntityRecord.mock.calls[ 0 ];
			expect( [ kind, name ] ).toEqual( [ 'postType', 'feedback' ] );
			expect( record ).toEqual( { id: 17, status: 'spam' } );
		} );

		it( 'requests the collection field format on the path core-data builds', async () => {
			const saveEntityRecord = jest.fn();

			await saveResponse( saveEntityRecord, { id: 17, status: 'spam' } );

			const { __unstableFetch } = saveEntityRecord.mock.calls[ 0 ][ 3 ];
			await __unstableFetch( { path: '/wp/v2/feedback/17', method: 'PUT', data: { id: 17 } } );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/feedback/17?fields_format=collection',
				method: 'PUT',
				data: { id: 17 },
			} );
		} );

		it( 'appends to a path that already carries a query string', async () => {
			const saveEntityRecord = jest.fn();

			await saveResponse( saveEntityRecord, { id: 17 } );

			const { __unstableFetch } = saveEntityRecord.mock.calls[ 0 ][ 3 ];
			await __unstableFetch( { path: '/wp/v2/feedback/17?context=edit' } );

			const { path } = apiFetch.mock.calls[ 0 ][ 0 ];
			expect( path ).toContain( 'context=edit' );
			expect( path ).toContain( 'fields_format=collection' );
			// A second "?" would make the query string unparseable.
			expect( path.indexOf( '?' ) ).toBe( path.lastIndexOf( '?' ) );
		} );

		it( 'preserves caller options', async () => {
			const saveEntityRecord = jest.fn();

			await saveResponse( saveEntityRecord, { id: 17 }, { throwOnError: true } );

			expect( saveEntityRecord.mock.calls[ 0 ][ 3 ] ).toEqual(
				expect.objectContaining( { throwOnError: true } )
			);
		} );
	} );

	describe( 'deleteResponse', () => {
		it( 'targets the feedback entity and asks for the collection format', async () => {
			const deleteEntityRecord = jest.fn();

			await deleteResponse( deleteEntityRecord, 17 );

			expect( deleteEntityRecord ).toHaveBeenCalledWith(
				'postType',
				'feedback',
				17,
				{ fields_format: 'collection' },
				{}
			);
		} );

		it( 'keeps caller query arguments and options', async () => {
			const deleteEntityRecord = jest.fn();

			await deleteResponse( deleteEntityRecord, 17, { force: true }, { throwOnError: true } );

			expect( deleteEntityRecord ).toHaveBeenCalledWith(
				'postType',
				'feedback',
				17,
				{ force: true, fields_format: 'collection' },
				{ throwOnError: true }
			);
		} );
	} );
} );
