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
	} );

	it( 'seeds from the bootstrap without fetching', () => {
		const { result } = renderHook( () => useSchemaSettings( RESPONSE ) );

		expect( mockApiFetch ).not.toHaveBeenCalled();
		expect( result.current.organization ).toEqual( RESPONSE.organization );
		expect( result.current.defaults ).toEqual( RESPONSE.defaults.organization );
		expect( result.current.isDirty ).toBe( false );
	} );

	it( 'tracks dirty state and saves through the schema-settings route', async () => {
		const onSave = jest.fn();
		const { result } = renderHook( () => useSchemaSettings( RESPONSE, onSave ) );

		act( () => result.current.setOrganizationField( { sameAs: [ 'https://twitter.com/acme' ] } ) );
		expect( result.current.isDirty ).toBe( true );

		const saved = {
			organization: { ...RESPONSE.organization, sameAs: [ 'https://twitter.com/acme' ] },
			defaults: RESPONSE.defaults,
		};
		mockApiFetch.mockResolvedValueOnce( saved );

		act( () => result.current.save() );

		await waitFor( () => expect( result.current.isDirty ).toBe( false ) );

		const post = mockApiFetch.mock.calls.find(
			( [ options ] ) => ( options as { method?: string } ).method === 'POST'
		);
		const options = post![ 0 ] as { path: string; data: { organization: { sameAs: string[] } } };
		expect( options.path ).toBe( '/jetpack/v4/seo/schema-settings' );
		expect( options.data.organization.sameAs ).toEqual( [ 'https://twitter.com/acme' ] );
		expect( onSave ).toHaveBeenCalledWith( saved );
		expect( createSuccessNotice ).toHaveBeenCalled();
	} );

	it( 'drops empty, invalid, and duplicate profile rows when tracking dirtiness and saving', async () => {
		const { result } = renderHook( () => useSchemaSettings( RESPONSE ) );

		// An all-invalid set cleans to empty, matching the baseline — so not dirty.
		act( () => result.current.setOrganizationField( { sameAs: [ '', '   ', 'not a url' ] } ) );
		expect( result.current.isDirty ).toBe( false );

		act( () =>
			result.current.setOrganizationField( {
				sameAs: [ 'not a url', ' https://twitter.com/acme ', 'https://twitter.com/acme' ],
			} )
		);
		expect( result.current.isDirty ).toBe( true );

		mockApiFetch.mockResolvedValueOnce( RESPONSE );
		act( () => result.current.save() );
		await waitFor( () => expect( createSuccessNotice ).toHaveBeenCalled() );

		const post = mockApiFetch.mock.calls.find(
			( [ options ] ) => ( options as { method?: string } ).method === 'POST'
		);
		const options = post![ 0 ] as { data: { organization: { sameAs: string[] } } };
		expect( options.data.organization.sameAs ).toEqual( [ 'https://twitter.com/acme' ] );
	} );
} );
