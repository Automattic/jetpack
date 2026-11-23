import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import { cleanLocalBusiness } from '../schema-settings-utils';
import { makeSchemaSettings } from './fixtures/schema-settings-fixtures';
import type { SchemaSettings } from '../schema-settings-types';

// Register ESM mocks before importing the hook; React state stays real.
const recordSeoEvent = jest.fn();
jest.unstable_mockModule( '../record-seo-event', () => ( { recordSeoEvent } ) );
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
		expect( recordSeoEvent ).not.toHaveBeenCalled();
		expect( result.current.siteRepresents ).toBe( 'organization' );
		expect( result.current.breadcrumbList ).toEqual( { enabled: true } );
		expect( result.current.organization ).toEqual( RESPONSE.organization );
		expect( result.current.localBusiness ).toEqual( RESPONSE.localBusiness );
		expect( result.current.person ).toEqual( RESPONSE.person );
		expect( result.current.defaults ).toEqual( RESPONSE.defaults.organization );
		expect( result.current.localBusinessDefaults ).toEqual( RESPONSE.defaults.localBusiness );
		expect( result.current.personDefaults ).toEqual( RESPONSE.defaults.person );
		expect( result.current.isOrganizationDirty ).toBe( false );
		expect( result.current.isLocalBusinessDirty ).toBe( false );
		expect( result.current.isPersonDirty ).toBe( false );
	} );

	it( 'saves the Organization entity — organization and local business — in one request', async () => {
		const onSave = jest.fn();
		const { result } = renderHook( () => useSchemaSettings( RESPONSE, onSave ) );

		act( () => {
			result.current.setOrganizationField( { sameAs: [ 'https://twitter.com/acme' ] } );
			result.current.setLocalBusinessField( { telephone: '+1 555 123 4567' } );
		} );
		expect( result.current.isOrganizationDirty ).toBe( true );
		expect( result.current.isLocalBusinessDirty ).toBe( true );

		const saved: SchemaSettings = {
			...RESPONSE,
			organization: { ...RESPONSE.organization, sameAs: [ 'https://twitter.com/acme' ] },
			localBusiness: { ...RESPONSE.localBusiness, telephone: '+1 555 123 4567' },
		};
		mockApiFetch.mockResolvedValueOnce( saved );

		act( () => result.current.saveOrganizationEntity() );

		await waitFor( () => expect( result.current.isOrganizationDirty ).toBe( false ) );
		// One Save persists both sections, so neither stays dirty afterward.
		expect( result.current.isLocalBusinessDirty ).toBe( false );
		expect( createInfoNotice ).toHaveBeenCalledWith( 'Saving schema settings…', expect.anything() );

		const post = mockApiFetch.mock.calls.find(
			( [ options ] ) => ( options as { method?: string } ).method === 'POST'
		);
		const options = post![ 0 ] as {
			path: string;
			data: Pick< SchemaSettings, 'organization' | 'localBusiness' >;
		};
		expect( options.path ).toBe( '/jetpack/v4/seo/schema-settings' );
		expect( Object.keys( options.data ).sort() ).toEqual( [ 'localBusiness', 'organization' ] );
		expect( options.data.organization.sameAs ).toEqual( [ 'https://twitter.com/acme' ] );
		expect( options.data.localBusiness.telephone ).toBe( '+1 555 123 4567' );
		expect( onSave ).toHaveBeenCalledWith( saved );
		expect( createSuccessNotice ).toHaveBeenCalled();
		expect( recordSeoEvent.mock.calls ).toEqual( [
			[
				'jetpack_seo_setting_updated',
				'settings',
				{ setting: 'schema_organization', verification_service: 'none', setting_value: 'set' },
			],
			[
				'jetpack_seo_setting_updated',
				'settings',
				{ setting: 'schema_localBusiness', verification_service: 'none', setting_value: 'set' },
			],
		] );
	} );

	it( 'ignores a second Save while one is in flight', async () => {
		const { result } = renderHook( () => useSchemaSettings( RESPONSE ) );

		act( () => result.current.setOrganizationField( { name: 'Acme' } ) );

		let release: ( settings: SchemaSettings ) => void = () => {};
		mockApiFetch.mockReturnValueOnce(
			new Promise< unknown >( resolve => {
				release = resolve as ( settings: SchemaSettings ) => void;
			} )
		);

		act( () => result.current.saveOrganizationEntity() );
		expect( result.current.isSaving ).toBe( true );

		// The in-flight guard drops the extra clicks rather than firing more requests.
		act( () => result.current.saveOrganizationEntity() );
		act( () => result.current.commitBreadcrumbList( { enabled: false } ) );
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
		expect( recordSeoEvent ).not.toHaveBeenCalled();
		// The dropped toggle must not leave the UI showing an unsent change.
		expect( result.current.breadcrumbList ).toEqual( { enabled: true } );

		act( () => release( RESPONSE ) );
		await waitFor( () => expect( result.current.isSaving ).toBe( false ) );
	} );

	it( 'auto-saves the site-entity choice without dragging in pending edits', async () => {
		const onSave = jest.fn();
		const { result } = renderHook( () => useSchemaSettings( RESPONSE, onSave ) );

		// A pending Person edit must stay local (and dirty) across the entity save.
		act( () => result.current.setPersonField( { name: 'Pending person' } ) );

		const saved: SchemaSettings = { ...RESPONSE, siteRepresents: 'person' };
		mockApiFetch.mockResolvedValueOnce( saved );

		act( () => result.current.commitSiteRepresents( 'person' ) );
		expect( result.current.siteRepresents ).toBe( 'person' );
		expect( createInfoNotice ).toHaveBeenCalledWith( 'Saving schema settings…', expect.anything() );

		await waitFor( () => expect( result.current.isSaving ).toBe( false ) );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/seo/schema-settings',
			method: 'POST',
			data: { siteRepresents: 'person' },
		} );
		expect( result.current.person.name ).toBe( 'Pending person' );
		expect( result.current.isPersonDirty ).toBe( true );
		expect( onSave ).toHaveBeenCalledWith( saved );
		expect( recordSeoEvent.mock.calls ).toEqual( [
			[
				'jetpack_seo_setting_updated',
				'settings',
				{ setting: 'schema_siteRepresents', verification_service: 'none', setting_value: 'person' },
			],
		] );
	} );

	it( 'saves only Person and preserves pending Organization edits', async () => {
		const { result } = renderHook( () => useSchemaSettings( RESPONSE ) );

		act( () => {
			result.current.setOrganizationField( { name: 'Pending organization' } );
			result.current.setPersonField( { sameAs: [ 'https://linkedin.com/in/jane' ] } );
		} );
		expect( result.current.isPersonDirty ).toBe( true );

		const saved: SchemaSettings = {
			...RESPONSE,
			person: { ...RESPONSE.person, sameAs: [ 'https://linkedin.com/in/jane' ] },
		};
		mockApiFetch.mockResolvedValueOnce( saved );

		act( () => result.current.savePerson() );
		await waitFor( () => expect( result.current.isPersonDirty ).toBe( false ) );
		expect( createInfoNotice ).toHaveBeenCalledWith( 'Saving schema settings…', expect.anything() );

		const post = mockApiFetch.mock.calls.find(
			( [ options ] ) => ( options as { method?: string } ).method === 'POST'
		);
		const options = post![ 0 ] as { data: Pick< SchemaSettings, 'person' > };
		expect( Object.keys( options.data ) ).toEqual( [ 'person' ] );
		expect( options.data.person.sameAs ).toEqual( [ 'https://linkedin.com/in/jane' ] );
		expect( result.current.organization.name ).toBe( 'Pending organization' );
		expect( result.current.isOrganizationDirty ).toBe( true );
	} );

	it( 'records saved Person fields without reporting pending Organization edits or field contents', async () => {
		const { result } = renderHook( () => useSchemaSettings( RESPONSE ) );
		act( () => {
			result.current.setOrganizationField( { name: 'Unsaved business' } );
			result.current.setPersonField( { name: 'Private name', description: 'Private biography' } );
		} );
		mockApiFetch.mockResolvedValueOnce(
			makeSchemaSettings( {
				person: { ...RESPONSE.person, name: 'Private name', description: 'Private biography' },
			} )
		);
		act( () => result.current.savePerson() );
		await waitFor( () => expect( result.current.isSaving ).toBe( false ) );
		expect( recordSeoEvent.mock.calls ).toEqual( [
			[
				'jetpack_seo_setting_updated',
				'settings',
				{ setting: 'schema_person', verification_service: 'none', setting_value: 'set' },
			],
		] );
	} );

	it.each( [ false, true ] )( 'records the saved BreadcrumbList value %s', async enabled => {
		const initial = makeSchemaSettings( { breadcrumbList: { enabled: ! enabled } } );
		const { result } = renderHook( () => useSchemaSettings( initial ) );
		mockApiFetch.mockResolvedValueOnce( makeSchemaSettings( { breadcrumbList: { enabled } } ) );
		act( () => result.current.commitBreadcrumbList( { enabled } ) );
		await waitFor( () => expect( result.current.isSaving ).toBe( false ) );
		expect( recordSeoEvent.mock.calls ).toEqual( [
			[
				'jetpack_seo_setting_updated',
				'settings',
				{ setting: 'schema_breadcrumbList', verification_service: 'none', setting_value: enabled },
			],
		] );
	} );

	it( 'records clearing the last nested business value as cleared', async () => {
		const initial = makeSchemaSettings( {
			localBusiness: {
				...RESPONSE.localBusiness,
				enabled: true,
				address: { ...RESPONSE.localBusiness.address, streetAddress: 'Private address' },
			},
		} );
		const { result } = renderHook( () => useSchemaSettings( initial ) );
		act( () =>
			result.current.setLocalBusinessField( { address: RESPONSE.localBusiness.address } )
		);
		mockApiFetch.mockResolvedValueOnce(
			makeSchemaSettings( { localBusiness: { ...RESPONSE.localBusiness, enabled: true } } )
		);
		act( () => result.current.saveOrganizationEntity() );
		await waitFor( () => expect( result.current.isSaving ).toBe( false ) );
		expect( recordSeoEvent.mock.calls ).toEqual( [
			[
				'jetpack_seo_setting_updated',
				'settings',
				{ setting: 'schema_localBusiness', verification_service: 'none', setting_value: 'cleared' },
			],
		] );
	} );

	it.each( [
		[ true, '' ],
		[ true, 'Private address' ],
		[ false, '' ],
		[ false, 'Private address' ],
	] )(
		'records LocalBusiness enabled=%s independently of address=%s',
		async ( enabled, streetAddress ) => {
			const localBusiness = {
				...RESPONSE.localBusiness,
				enabled: ! enabled,
				address: { ...RESPONSE.localBusiness.address, streetAddress },
			};
			const initial = makeSchemaSettings( { localBusiness } );
			const { result } = renderHook( () => useSchemaSettings( initial ) );
			act( () => result.current.setLocalBusinessField( { enabled } ) );
			mockApiFetch.mockResolvedValueOnce(
				makeSchemaSettings( { localBusiness: { ...localBusiness, enabled } } )
			);
			act( () => result.current.saveOrganizationEntity() );
			await waitFor( () => expect( result.current.isSaving ).toBe( false ) );
			expect( recordSeoEvent.mock.calls ).toEqual( [
				[
					'jetpack_seo_setting_updated',
					'settings',
					{
						setting: 'schema_localBusiness_enabled',
						verification_service: 'none',
						setting_value: enabled,
					},
				],
			] );
		}
	);

	it.each( [ true, false ] )(
		'records a rejected LocalBusiness enabled=%s save while retaining fields',
		async enabled => {
			const localBusiness = {
				...RESPONSE.localBusiness,
				enabled: ! enabled,
				telephone: 'Private telephone',
			};
			const { result } = renderHook( () =>
				useSchemaSettings( makeSchemaSettings( { localBusiness } ) )
			);
			act( () => result.current.setLocalBusinessField( { enabled } ) );
			mockApiFetch.mockRejectedValueOnce( new Error( 'Save refused' ) );
			act( () => result.current.saveOrganizationEntity() );
			await waitFor( () => expect( result.current.isSaving ).toBe( false ) );
			expect( result.current.localBusiness.enabled ).toBe( enabled );
			expect( result.current.isLocalBusinessDirty ).toBe( true );
			expect( recordSeoEvent.mock.calls ).toEqual( [
				[
					'jetpack_seo_setting_update_failed',
					'settings',
					{
						setting: 'schema_localBusiness_enabled',
						verification_service: 'none',
						setting_value: enabled,
					},
				],
			] );
		}
	);

	it.each( [ 'organization', 'person' ] as const )(
		'does not count equivalent %s profile URLs as changed',
		async section => {
			const initial = makeSchemaSettings( {
				[ section ]: { ...RESPONSE[ section ], sameAs: [ 'https://example.com' ] },
			} );
			const { result } = renderHook( () => useSchemaSettings( initial ) );
			act( () => {
				if ( section === 'organization' ) {
					result.current.setOrganizationField( { name: '   ' } );
				} else {
					result.current.setPersonField( { name: '   ' } );
				}
			} );
			mockApiFetch.mockResolvedValueOnce( initial );
			act( () => {
				if ( section === 'organization' ) {
					result.current.saveOrganizationEntity();
				} else {
					result.current.savePerson();
				}
			} );
			await waitFor( () => expect( result.current.isSaving ).toBe( false ) );
			expect( recordSeoEvent ).not.toHaveBeenCalled();
		}
	);

	it( 'records a failed Person save and its retry without counting an unchanged failed retry', async () => {
		const { result } = renderHook( () => useSchemaSettings( RESPONSE ) );
		act( () => result.current.setPersonField( { name: 'Private person' } ) );
		mockApiFetch.mockRejectedValueOnce( new Error( 'Save refused' ) );
		act( () => result.current.savePerson() );
		await waitFor( () => expect( result.current.isSaving ).toBe( false ) );
		expect( result.current.person.name ).toBe( 'Private person' );
		expect( result.current.isPersonDirty ).toBe( true );
		expect( recordSeoEvent.mock.calls ).toEqual( [
			[
				'jetpack_seo_setting_update_failed',
				'settings',
				{ setting: 'schema_person', verification_service: 'none', setting_value: 'set' },
			],
		] );

		mockApiFetch.mockResolvedValueOnce(
			makeSchemaSettings( { person: { ...RESPONSE.person, name: 'Private person' } } )
		);
		act( () => result.current.savePerson() );
		await waitFor( () => expect( result.current.isSaving ).toBe( false ) );
		expect( result.current.isPersonDirty ).toBe( false );
		const expected = [
			[
				'jetpack_seo_setting_update_failed',
				'settings',
				{ setting: 'schema_person', verification_service: 'none', setting_value: 'set' },
			],
			[
				'jetpack_seo_setting_updated',
				'settings',
				{ setting: 'schema_person', verification_service: 'none', setting_value: 'set' },
			],
		];
		expect( recordSeoEvent.mock.calls ).toEqual( expected );

		mockApiFetch.mockRejectedValueOnce( new Error( 'Unchanged save refused' ) );
		act( () => result.current.savePerson() );
		await waitFor( () => expect( result.current.isSaving ).toBe( false ) );
		expect( recordSeoEvent.mock.calls ).toEqual( expected );
	} );

	it( 'does not record unchanged saves or unrelated sections changed by another session', async () => {
		const { result } = renderHook( () => useSchemaSettings( RESPONSE ) );
		act( () => result.current.setPersonField( { name: '   ' } ) );
		mockApiFetch.mockResolvedValueOnce(
			makeSchemaSettings( {
				organization: { ...RESPONSE.organization, name: 'Changed elsewhere' },
			} )
		);
		act( () => result.current.savePerson() );
		await waitFor( () => expect( result.current.isSaving ).toBe( false ) );
		expect( recordSeoEvent ).not.toHaveBeenCalled();
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

	it( 'reports a failed BreadcrumbList auto-save and rolls the toggle back', async () => {
		const { result } = renderHook( () => useSchemaSettings( RESPONSE ) );
		expect( result.current.breadcrumbList ).toEqual( { enabled: true } );

		mockApiFetch.mockRejectedValueOnce( new Error( 'nope' ) );

		act( () => result.current.commitBreadcrumbList( { enabled: false } ) );
		// Optimistically flips immediately for feedback…
		expect( result.current.breadcrumbList ).toEqual( { enabled: false } );
		await waitFor( () => expect( result.current.isSaving ).toBe( false ) );

		// …then reverts to the last-saved value when the save fails.
		expect( result.current.breadcrumbList ).toEqual( { enabled: true } );
		expect( createErrorNotice ).toHaveBeenCalledWith( 'nope', expect.anything() );
		expect( recordSeoEvent.mock.calls ).toEqual( [
			[
				'jetpack_seo_setting_update_failed',
				'settings',
				{ setting: 'schema_breadcrumbList', verification_service: 'none', setting_value: false },
			],
		] );
	} );

	it( 'rolls the site-entity choice back when its auto-save fails', async () => {
		const { result } = renderHook( () => useSchemaSettings( RESPONSE ) );
		expect( result.current.siteRepresents ).toBe( 'organization' );

		mockApiFetch.mockRejectedValueOnce( new Error( 'nope' ) );

		act( () => result.current.commitSiteRepresents( 'person' ) );
		// Optimistically switches the visible entity immediately…
		expect( result.current.siteRepresents ).toBe( 'person' );
		await waitFor( () => expect( result.current.isSaving ).toBe( false ) );

		// …then reverts so the card can't keep showing an unpersisted entity.
		expect( result.current.siteRepresents ).toBe( 'organization' );
		expect( createErrorNotice ).toHaveBeenCalledWith( 'nope', expect.anything() );
		expect( recordSeoEvent.mock.calls ).toEqual( [
			[
				'jetpack_seo_setting_update_failed',
				'settings',
				{ setting: 'schema_siteRepresents', verification_service: 'none', setting_value: 'person' },
			],
		] );
	} );

	it( 'reports a failed Organization-entity save and keeps the edits pending', async () => {
		const { result } = renderHook( () => useSchemaSettings( RESPONSE ) );

		act( () => {
			result.current.setOrganizationField( { name: 'Acme' } );
			result.current.setLocalBusinessField( { telephone: '+1 555 123 4567' } );
		} );

		mockApiFetch.mockRejectedValueOnce( new Error( 'nope' ) );

		act( () => result.current.saveOrganizationEntity() );
		await waitFor( () => expect( result.current.isSaving ).toBe( false ) );

		expect( createErrorNotice ).toHaveBeenCalledWith( 'nope', expect.anything() );
		expect( recordSeoEvent.mock.calls ).toEqual( [
			[
				'jetpack_seo_setting_update_failed',
				'settings',
				{ setting: 'schema_organization', verification_service: 'none', setting_value: 'set' },
			],
			[
				'jetpack_seo_setting_update_failed',
				'settings',
				{ setting: 'schema_localBusiness', verification_service: 'none', setting_value: 'set' },
			],
		] );
		// Unlike the auto-saving toggle, explicit field edits are kept so the admin
		// can retry without retyping.
		expect( result.current.organization.name ).toBe( 'Acme' );
		expect( result.current.localBusiness.telephone ).toBe( '+1 555 123 4567' );
		expect( result.current.isOrganizationDirty ).toBe( true );
		expect( result.current.isLocalBusinessDirty ).toBe( true );
	} );

	it( 'trims and uppercases the country code when saving the Organization entity', async () => {
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
		act( () => result.current.saveOrganizationEntity() );
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
		act( () => result.current.saveOrganizationEntity() );
		await waitFor( () => expect( createSuccessNotice ).toHaveBeenCalled() );

		const post = mockApiFetch.mock.calls.find(
			( [ options ] ) => ( options as { method?: string } ).method === 'POST'
		);
		const options = post![ 0 ] as {
			data: Pick< SchemaSettings, 'organization' | 'localBusiness' >;
		};
		expect( options.data.organization.sameAs ).toEqual( [ 'https://twitter.com/acme' ] );
		// Only the Organization was touched, so only the Organization is sent.
		expect( Object.keys( options.data ) ).toEqual( [ 'organization' ] );
	} );

	it.each( [
		[ 'the Organization alone', { organization: true, localBusiness: false }, [ 'organization' ] ],
		[
			'the local business alone',
			{ organization: false, localBusiness: true },
			[ 'localBusiness' ],
		],
		[ 'both', { organization: true, localBusiness: true }, [ 'localBusiness', 'organization' ] ],
	] )( 'sends only what changed when %s is edited', async ( _label, edit, expected ) => {
		// The route merges partial payloads, so an untouched section keeps whatever is
		// stored. Sending both unconditionally would let a save here overwrite a
		// local-business edit made in another tab with this tab's stale copy.
		const { result } = renderHook( () => useSchemaSettings( RESPONSE ) );

		act( () => {
			if ( edit.organization ) {
				result.current.setOrganizationField( { name: 'Acme Inc' } );
			}
			if ( edit.localBusiness ) {
				result.current.setLocalBusinessField( { telephone: '+1 555 123 4567' } );
			}
		} );

		mockApiFetch.mockResolvedValueOnce( RESPONSE );
		act( () => result.current.saveOrganizationEntity() );
		await waitFor( () => expect( createSuccessNotice ).toHaveBeenCalled() );

		const post = mockApiFetch.mock.calls.find(
			( [ options ] ) => ( options as { method?: string } ).method === 'POST'
		);
		const options = post![ 0 ] as { data: Partial< SchemaSettings > };
		expect( Object.keys( options.data ).sort() ).toEqual( expected );
	} );
} );
