/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistry, RegistryProvider } from '@wordpress/data';
/**
 * Internal dependencies
 */
import useFormRecord from '../../../../src/dashboard/hooks/use-form-record';

const FORM = { id: 42, title: { rendered: 'Contact' }, status: 'trash' };

const fetchHandler = jest.fn( async ( { path, method, parse } ) => {
	if ( path.startsWith( '/wp/v2/types' ) ) {
		return {
			jetpack_form: {
				slug: 'jetpack_form',
				rest_base: 'jetpack-forms',
				rest_namespace: 'wp/v2',
				name: 'Forms',
			},
		};
	}
	if ( path.startsWith( '/wp/v2/jetpack-forms/42' ) && method === 'DELETE' ) {
		return { deleted: true, previous: FORM };
	}
	if ( path.startsWith( '/wp/v2/jetpack-forms/42' ) ) {
		return parse === false ? { json: async () => FORM, headers: { get: () => null } } : FORM;
	}
	return {};
} );

describe( 'useFormRecord', () => {
	let registry;
	const wrapper = ( { children } ) => (
		<RegistryProvider value={ registry }>{ children }</RegistryProvider>
	);

	beforeEach( () => {
		fetchHandler.mockClear();
		apiFetch.setFetchHandler( fetchHandler );
		registry = createRegistry();
		registry.register( coreStore );
	} );

	it( 'loads the form record', async () => {
		const { result } = renderHook( () => useFormRecord( 42 ), { wrapper } );

		await waitFor( () => expect( result.current?.title?.rendered ).toBe( 'Contact' ) );
	} );

	it( 'leaves core-data able to delete the form afterwards', async () => {
		const { result } = renderHook( () => useFormRecord( 42 ), { wrapper } );
		await waitFor( () => expect( result.current ).toBeDefined() );

		await act( () =>
			expect(
				registry
					.dispatch( coreStore )
					.deleteEntityRecord(
						'postType',
						'jetpack_form',
						42,
						{ force: true },
						{ throwOnError: true }
					)
			).resolves.toBeDefined()
		);
	} );

	it( 'does not load anything without an ID', () => {
		const { result } = renderHook( () => useFormRecord( null ), { wrapper } );

		expect( result.current ).toBeUndefined();
		expect( fetchHandler ).not.toHaveBeenCalled();
	} );
} );
