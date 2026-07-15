import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import { cleanLocalBusiness } from '../schema-settings-utils';
import { makeSchemaSettings } from './fixtures/schema-settings-fixtures';
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
const RESPONSE: SchemaSettings = makeSchemaSettings();

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
		expect( result.current.localBusiness ).toEqual( RESPONSE.localBusiness );
		expect( result.current.defaults ).toEqual( RESPONSE.defaults.organization );
		expect( result.current.localBusinessDefaults ).toEqual( RESPONSE.defaults.localBusiness );
		expect( result.current.isDirty ).toBe( false );
	} );

	it( 'tracks dirty state and saves through the schema-settings route', async () => {
		const onSave = jest.fn();
		const { result } = renderHook( () => useSchemaSettings( RESPONSE, onSave ) );

		act( () => result.current.setOrganizationField( { sameAs: [ 'https://twitter.com/acme' ] } ) );
		expect( result.current.isDirty ).toBe( true );

		const saved = {
			organization: { ...RESPONSE.organization, sameAs: [ 'https://twitter.com/acme' ] },
			localBusiness: RESPONSE.localBusiness,
			defaults: RESPONSE.defaults,
		};
		mockApiFetch.mockResolvedValueOnce( saved );

		act( () => result.current.save() );

		await waitFor( () => expect( result.current.isDirty ).toBe( false ) );

		const post = mockApiFetch.mock.calls.find(
			( [ options ] ) => ( options as { method?: string } ).method === 'POST'
		);
		const options = post![ 0 ] as {
			path: string;
			data: { organization: { sameAs: string[] }; localBusiness: typeof RESPONSE.localBusiness };
		};
		expect( options.path ).toBe( '/jetpack/v4/seo/schema-settings' );
		expect( options.data.organization.sameAs ).toEqual( [ 'https://twitter.com/acme' ] );
		expect( options.data.localBusiness ).toEqual( RESPONSE.localBusiness );
		expect( result.current.localBusiness ).toEqual( saved.localBusiness );
		expect( onSave ).toHaveBeenCalledWith( saved );
		expect( createSuccessNotice ).toHaveBeenCalled();
	} );

	it( 'tracks dirty state and re-seeds localBusiness after saving', async () => {
		const { result } = renderHook( () => useSchemaSettings( RESPONSE ) );

		act( () =>
			result.current.setLocalBusinessField( {
				enabled: true,
				address: { ...RESPONSE.localBusiness.address, streetAddress: '123 Main St' },
			} )
		);
		expect( result.current.isDirty ).toBe( true );

		const saved: SchemaSettings = {
			...RESPONSE,
			localBusiness: {
				...RESPONSE.localBusiness,
				enabled: true,
				address: { ...RESPONSE.localBusiness.address, streetAddress: '123 Main St' },
			},
		};
		mockApiFetch.mockResolvedValueOnce( saved );

		act( () => result.current.save() );
		await waitFor( () => expect( result.current.isDirty ).toBe( false ) );

		const post = mockApiFetch.mock.calls.find(
			( [ options ] ) => ( options as { method?: string } ).method === 'POST'
		);
		const options = post![ 0 ] as {
			data: { localBusiness: { enabled: boolean; address: { streetAddress: string } } };
		};
		expect( options.data.localBusiness.enabled ).toBe( true );
		expect( options.data.localBusiness.address.streetAddress ).toBe( '123 Main St' );
		expect( result.current.localBusiness ).toEqual( saved.localBusiness );
	} );

	it( 'trims and uppercases the country code when saving LocalBusiness settings', async () => {
		const { result } = renderHook( () => useSchemaSettings( RESPONSE ) );

		act( () =>
			result.current.setLocalBusinessField( {
				address: { ...RESPONSE.localBusiness.address, addressCountry: ' us ' },
			} )
		);

		const saved: SchemaSettings = {
			...RESPONSE,
			localBusiness: {
				...RESPONSE.localBusiness,
				address: { ...RESPONSE.localBusiness.address, addressCountry: 'US' },
			},
		};
		mockApiFetch.mockResolvedValueOnce( saved );
		act( () => result.current.save() );
		await waitFor( () => expect( createSuccessNotice ).toHaveBeenCalled() );

		const post = mockApiFetch.mock.calls.find(
			( [ options ] ) => ( options as { method?: string } ).method === 'POST'
		);
		const options = post![ 0 ] as {
			data: { localBusiness: { address: { addressCountry: string } } };
		};
		expect( options.data.localBusiness.address.addressCountry ).toBe( 'US' );
		expect( result.current.localBusiness.address.addressCountry ).toBe( 'US' );
	} );

	it( 'does not normalize non-ASCII country input into a valid code', () => {
		const localBusiness = structuredClone( RESPONSE.localBusiness );
		localBusiness.address.addressCountry = ' ſs ';

		expect( cleanLocalBusiness( localBusiness ).address.addressCountry ).toBe( 'ſs' );
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
		const options = post![ 0 ] as {
			data: { organization: { sameAs: string[] }; localBusiness: typeof RESPONSE.localBusiness };
		};
		expect( options.data.organization.sameAs ).toEqual( [ 'https://twitter.com/acme' ] );
		expect( options.data.localBusiness ).toEqual( RESPONSE.localBusiness );
	} );
} );
