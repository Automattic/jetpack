import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { SchemaSettings } from '../schema-settings-types';

// True-ESM Jest (`--experimental-vm-modules`): register mocks with
// `jest.unstable_mockModule`, then import the hook dynamically. `@wordpress/element`
// stays real so the hook's state/refs behave; only the data/REST edges are stubbed.
const mockApiFetch = jest.fn< ( options: unknown ) => Promise< unknown > >();
const createInfoNotice = jest.fn();
const createSuccessNotice = jest.fn();
const createErrorNotice = jest.fn();

// A site with no stored overrides: empty editable values, site identity exposed
// as the placeholder defaults.
const RESPONSE: SchemaSettings = {
	organization: { name: '', description: '', sameAs: [], email: '' },
	defaults: { organization: { name: 'Acme Co', description: 'We make things' } },
};

jest.unstable_mockModule( '@wordpress/api-fetch', () => ( { default: mockApiFetch } ) );
jest.unstable_mockModule( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: () => ( { createInfoNotice, createSuccessNotice, createErrorNotice } ),
} ) );

const { useSchemaSettings } = await import( '../use-schema-settings' );

describe( 'useSchemaSettings', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockApiFetch.mockResolvedValue( RESPONSE );
	} );

	it( 'fetches stored overrides + placeholder defaults on mount', async () => {
		const { result } = renderHook( () => useSchemaSettings() );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect( mockApiFetch ).toHaveBeenCalledWith( { path: '/jetpack/v4/seo/schema-settings' } );
		expect( result.current.organization ).toEqual( RESPONSE.organization );
		expect( result.current.defaults ).toEqual( RESPONSE.defaults.organization );
		expect( result.current.isDirty ).toBe( false );
	} );

	it( 'tracks dirty state and saves through the schema-settings route only', async () => {
		const { result } = renderHook( () => useSchemaSettings() );
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		act( () => result.current.setOrganizationField( { sameAs: [ 'https://twitter.com/acme' ] } ) );
		expect( result.current.isDirty ).toBe( true );

		// The POST returns the (sanitized) editing payload.
		mockApiFetch.mockResolvedValueOnce( {
			organization: { ...RESPONSE.organization, sameAs: [ 'https://twitter.com/acme' ] },
			defaults: RESPONSE.defaults,
		} );

		act( () => result.current.save() );

		await waitFor( () => expect( result.current.isDirty ).toBe( false ) );

		const post = mockApiFetch.mock.calls.find(
			( [ options ] ) => ( options as { method?: string } ).method === 'POST'
		);
		expect( post ).toBeDefined();
		const options = post![ 0 ] as { path: string; data: { organization: { sameAs: string[] } } };
		expect( options.path ).toBe( '/jetpack/v4/seo/schema-settings' );
		expect( options.data.organization.sameAs ).toEqual( [ 'https://twitter.com/acme' ] );
		expect( createSuccessNotice ).toHaveBeenCalled();
	} );

	it( 'ignores empty and invalid social profile rows when tracking dirtiness and saving', async () => {
		const { result } = renderHook( () => useSchemaSettings() );
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		act( () =>
			result.current.setOrganizationField( {
				sameAs: [ '', '   ', 'not a url', 'sasada', 'bsky.app/profile/acme.example' ],
			} )
		);
		expect( result.current.isDirty ).toBe( false );

		act( () =>
			result.current.setOrganizationField( {
				name: 'Acme Corporation',
				sameAs: [
					'',
					'not a url',
					'sasada',
					' https://twitter.com/acme ',
					'https://twitter.com/acme',
					'https://bsky.app/profile/acme.example',
				],
			} )
		);
		expect( result.current.isDirty ).toBe( true );

		mockApiFetch.mockResolvedValueOnce( {
			organization: {
				...RESPONSE.organization,
				name: 'Acme Corporation',
				sameAs: [ 'https://twitter.com/acme', 'https://bsky.app/profile/acme.example' ],
			},
			defaults: RESPONSE.defaults,
		} );

		act( () => result.current.save() );

		await waitFor( () => expect( createSuccessNotice ).toHaveBeenCalled() );

		const post = mockApiFetch.mock.calls.find(
			( [ options ] ) => ( options as { method?: string } ).method === 'POST'
		);
		const options = post![ 0 ] as { data: { organization: { sameAs: string[] } } };
		expect( options.data.organization.sameAs ).toEqual( [
			'https://twitter.com/acme',
			'https://bsky.app/profile/acme.example',
		] );
	} );
} );
