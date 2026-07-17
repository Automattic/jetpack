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
		expect( result.current.breadcrumbList ).toEqual( { enabled: true } );
		expect( result.current.organization ).toEqual( RESPONSE.organization );
		expect( result.current.localBusiness ).toEqual( RESPONSE.localBusiness );
		expect( result.current.defaults ).toEqual( RESPONSE.defaults.organization );
		expect( result.current.localBusinessDefaults ).toEqual( RESPONSE.defaults.localBusiness );
		expect( result.current.isOrganizationDirty ).toBe( false );
		expect( result.current.isLocalBusinessDirty ).toBe( false );
	} );

	it( 'saves only Organization and preserves pending LocalBusiness edits', async () => {
		const onSave = jest.fn();
		const { result } = renderHook( () => useSchemaSettings( RESPONSE, onSave ) );

		act( () => {
			result.current.setOrganizationField( { sameAs: [ 'https://twitter.com/acme' ] } );
			result.current.setLocalBusinessField( { telephone: '+1 555 123 4567' } );
		} );
		expect( result.current.isOrganizationDirty ).toBe( true );
		expect( result.current.isLocalBusinessDirty ).toBe( true );

		const saved = {
			breadcrumbList: RESPONSE.breadcrumbList,
			organization: { ...RESPONSE.organization, sameAs: [ 'https://twitter.com/acme' ] },
			localBusiness: RESPONSE.localBusiness,
			defaults: RESPONSE.defaults,
		};
		mockApiFetch.mockResolvedValueOnce( saved );

		act( () => result.current.saveOrganization() );

		await waitFor( () => expect( result.current.isOrganizationDirty ).toBe( false ) );
		expect( createInfoNotice ).toHaveBeenCalledWith( 'Saving organization…', expect.anything() );

		const post = mockApiFetch.mock.calls.find(
			( [ options ] ) => ( options as { method?: string } ).method === 'POST'
		);
		const options = post![ 0 ] as {
			path: string;
			data: Pick< SchemaSettings, 'organization' >;
		};
		expect( options.path ).toBe( '/jetpack/v4/seo/schema-settings' );
		expect( options.data ).toEqual( {
			organization: { ...RESPONSE.organization, sameAs: [ 'https://twitter.com/acme' ] },
		} );
		expect( result.current.localBusiness.telephone ).toBe( '+1 555 123 4567' );
		expect( result.current.isLocalBusinessDirty ).toBe( true );
		expect( onSave ).toHaveBeenCalledWith( saved );
		expect( createSuccessNotice ).toHaveBeenCalled();
	} );

	it( 'auto-saves the BreadcrumbList toggle without dragging in pending edits', async () => {
		const onSave = jest.fn();
		const { result } = renderHook( () => useSchemaSettings( RESPONSE, onSave ) );

		// A pending Organization edit must stay local (and dirty) across the toggle save.
		act( () => result.current.setOrganizationField( { name: 'Pending edit' } ) );

		const saved: SchemaSettings = {
			...RESPONSE,
			breadcrumbList: { enabled: false },
		};
		mockApiFetch.mockResolvedValueOnce( saved );

		act( () => result.current.commitBreadcrumbList( { enabled: false } ) );
		expect( result.current.breadcrumbList ).toEqual( { enabled: false } );
		expect( createInfoNotice ).toHaveBeenCalledWith( 'Saving breadcrumbs…', expect.anything() );

		await waitFor( () => expect( result.current.isSaving ).toBe( false ) );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/seo/schema-settings',
			method: 'POST',
			data: { breadcrumbList: { enabled: false } },
		} );
		expect( result.current.breadcrumbList ).toEqual( { enabled: false } );
		expect( result.current.organization.name ).toBe( 'Pending edit' );
		expect( result.current.isOrganizationDirty ).toBe( true );
		expect( result.current.isLocalBusinessDirty ).toBe( false );
		expect( onSave ).toHaveBeenCalledWith( saved );
		expect( createSuccessNotice ).toHaveBeenCalled();
	} );

	it( 'reports a failed BreadcrumbList auto-save', async () => {
		const { result } = renderHook( () => useSchemaSettings( RESPONSE ) );

		mockApiFetch.mockRejectedValueOnce( new Error( 'nope' ) );

		act( () => result.current.commitBreadcrumbList( { enabled: false } ) );
		await waitFor( () => expect( result.current.isSaving ).toBe( false ) );

		expect( createErrorNotice ).toHaveBeenCalledWith( 'nope', expect.anything() );
	} );

	it( 'saves only LocalBusiness and preserves pending Organization edits', async () => {
		const { result } = renderHook( () => useSchemaSettings( RESPONSE ) );

		act( () => {
			result.current.setOrganizationField( { name: 'Pending organization' } );
			result.current.setLocalBusinessField( {
				enabled: true,
				address: { ...RESPONSE.localBusiness.address, streetAddress: '123 Main St' },
			} );
		} );
		expect( result.current.isOrganizationDirty ).toBe( true );
		expect( result.current.isLocalBusinessDirty ).toBe( true );

		const saved: SchemaSettings = {
			...RESPONSE,
			localBusiness: {
				...RESPONSE.localBusiness,
				enabled: true,
				address: { ...RESPONSE.localBusiness.address, streetAddress: '123 Main St' },
			},
		};
		mockApiFetch.mockResolvedValueOnce( saved );

		act( () => result.current.saveLocalBusiness() );
		await waitFor( () => expect( result.current.isLocalBusinessDirty ).toBe( false ) );
		expect( createInfoNotice ).toHaveBeenCalledWith( 'Saving local business…', expect.anything() );

		const post = mockApiFetch.mock.calls.find(
			( [ options ] ) => ( options as { method?: string } ).method === 'POST'
		);
		const options = post![ 0 ] as {
			data: { localBusiness: { enabled: boolean; address: { streetAddress: string } } };
		};
		expect( options.data.localBusiness.enabled ).toBe( true );
		expect( options.data.localBusiness.address.streetAddress ).toBe( '123 Main St' );
		expect( Object.keys( options.data ) ).toEqual( [ 'localBusiness' ] );
		expect( result.current.localBusiness ).toEqual( saved.localBusiness );
		expect( result.current.organization.name ).toBe( 'Pending organization' );
		expect( result.current.isOrganizationDirty ).toBe( true );
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
		act( () => result.current.saveLocalBusiness() );
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
		expect( result.current.isOrganizationDirty ).toBe( false );

		act( () =>
			result.current.setOrganizationField( {
				sameAs: [ 'not a url', ' https://twitter.com/acme ', 'https://twitter.com/acme' ],
			} )
		);
		expect( result.current.isOrganizationDirty ).toBe( true );

		mockApiFetch.mockResolvedValueOnce( RESPONSE );
		act( () => result.current.saveOrganization() );
		await waitFor( () => expect( createSuccessNotice ).toHaveBeenCalled() );

		const post = mockApiFetch.mock.calls.find(
			( [ options ] ) => ( options as { method?: string } ).method === 'POST'
		);
		const options = post![ 0 ] as {
			data: Pick< SchemaSettings, 'organization' >;
		};
		expect( options.data.organization.sameAs ).toEqual( [ 'https://twitter.com/acme' ] );
		expect( Object.keys( options.data ) ).toEqual( [ 'organization' ] );
	} );
} );
