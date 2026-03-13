import { act, renderHook } from '@testing-library/react';
import { RegistryProvider } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { usePostPrePublishValue } from '../';
import {
	connections as connectionsList,
	createRegistryWithStores,
} from '../../../utils/test-utils';

const connections = connectionsList.map( connection => ( { ...connection, enabled: true } ) );

const post = {
	jetpack_publicize_connections: [ connections[ 0 ] ],
};

describe( 'usePostPrePublishValue', () => {
	it( 'should return the value by default', async () => {
		const registry = createRegistryWithStores( post );

		const { result } = renderHook( () => usePostPrePublishValue( 'test-value' ), {
			wrapper: ( { children } ) => (
				<RegistryProvider value={ registry }>{ children }</RegistryProvider>
			),
		} );

		expect( result.current ).toBe( 'test-value' );
	} );

	it( 'should return the updated value when the post is not being published', async () => {
		const registry = createRegistryWithStores( post );

		const { rerender, result } = renderHook(
			( initialValue = 'first-value' ) => usePostPrePublishValue( initialValue ),
			{
				wrapper: ( { children } ) => (
					<RegistryProvider value={ registry }>{ children }</RegistryProvider>
				),
			}
		);

		rerender( 'second-value' );

		await act( async () => {
			await registry.dispatch( editorStore ).editPost( {
				status: 'draft',
				content: 'Some test content',
			} );
		} );

		expect( result.current ).toBe( 'second-value' );
	} );

	it( 'should preserve the pre-publish value', async () => {
		const registry = createRegistryWithStores( post );

		const { rerender, result } = renderHook(
			( initialValue = 'first-value' ) => usePostPrePublishValue( initialValue ),
			{
				wrapper: ( { children } ) => (
					<RegistryProvider value={ registry }>{ children }</RegistryProvider>
				),
			}
		);

		rerender( 'second-value' );

		await act( async () => {
			registry.dispatch( editorStore ).editPost( {
				status: 'publish',
				content: 'Some test content',
			} );
			registry.dispatch( editorStore ).savePost();
		} );

		rerender( 'third-value' );

		expect( result.current ).toBe( 'second-value' );
	} );
} );
