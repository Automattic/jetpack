import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useFeatureSettings } from '../use-feature-settings';

jest.mock( '@wordpress/api-fetch' );

// The component module imports the webpack-aliased 'lib/analytics', which
// doesn't resolve under jest — provide it virtually.
jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

const SETTINGS = {
	host_allows_ai: true,
	master_enabled: true,
	features: {
		writing_assistant: { enabled: true },
		excerpt: { enabled: false },
	},
};

describe( 'useFeatureSettings', () => {
	afterEach( () => {
		jest.resetAllMocks();
	} );

	test( 'loads settings on mount', async () => {
		apiFetch.mockResolvedValueOnce( SETTINGS );

		const { result } = renderHook( () => useFeatureSettings() );
		expect( result.current.isLoading ).toBe( true );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.settings ).toEqual( SETTINGS );
		expect( result.current.error ).toBeNull();
	} );

	test( 'surfaces a load failure as an error message', async () => {
		apiFetch.mockRejectedValueOnce( new Error( 'no route' ) );

		const { result } = renderHook( () => useFeatureSettings() );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.error ).toBe( 'no route' );
		expect( result.current.settings ).toBeNull();
	} );

	test( 'updateSettings marks only the touched keys as saving, then replaces settings', async () => {
		apiFetch.mockResolvedValueOnce( SETTINGS );
		const { result } = renderHook( () => useFeatureSettings() );
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		let resolvePost;
		apiFetch.mockReturnValueOnce( new Promise( resolve => ( resolvePost = resolve ) ) );

		const updated = { ...SETTINGS, features: { ...SETTINGS.features, excerpt: { enabled: true } } };
		let request;
		act( () => {
			request = result.current.updateSettings( { features: { excerpt: true } } );
		} );

		expect( result.current.savingKeys.has( 'excerpt' ) ).toBe( true );
		expect( result.current.savingKeys.has( 'writing_assistant' ) ).toBe( false );

		await act( async () => {
			resolvePost( updated );
			await request;
		} );

		expect( result.current.savingKeys.size ).toBe( 0 );
		expect( result.current.settings ).toEqual( updated );
		expect( apiFetch ).toHaveBeenLastCalledWith(
			expect.objectContaining( { method: 'POST', data: { features: { excerpt: true } } } )
		);
	} );

	test( 'a failed save sets the error, keeps prior settings, and clears saving state', async () => {
		apiFetch.mockResolvedValueOnce( SETTINGS );
		const { result } = renderHook( () => useFeatureSettings() );
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		apiFetch.mockRejectedValueOnce( new Error( 'offline' ) );

		await act( async () => {
			await expect(
				result.current.updateSettings( { features: { excerpt: true } } )
			).rejects.toThrow( 'offline' );
		} );

		expect( result.current.error ).toBe( 'offline' );
		expect( result.current.settings ).toEqual( SETTINGS );
		expect( result.current.savingKeys.size ).toBe( 0 );
	} );

	test( 'a master switch update is tracked under the __master__ key', async () => {
		apiFetch.mockResolvedValueOnce( SETTINGS );
		const { result } = renderHook( () => useFeatureSettings() );
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		let resolvePost;
		apiFetch.mockReturnValueOnce( new Promise( resolve => ( resolvePost = resolve ) ) );

		let request;
		act( () => {
			request = result.current.updateSettings( { master_enabled: false } );
		} );

		expect( result.current.savingKeys.has( '__master__' ) ).toBe( true );

		await act( async () => {
			resolvePost( SETTINGS );
			await request;
		} );
		expect( result.current.savingKeys.size ).toBe( 0 );
	} );
} );

describe( 'visibleSections', () => {
	const { visibleSections } = require( '../index' );

	const SECTIONS = [
		{
			key: 'content',
			features: [ { key: 'writing_assistant' }, { key: 'excerpt' } ],
		},
		{
			key: 'media',
			features: [ { key: 'feature_clip' } ],
		},
	];

	test( 'keeps only the rows present in the settings response', () => {
		const sections = visibleSections( SECTIONS, {
			writing_assistant: { enabled: true },
			feature_clip: { enabled: false },
		} );

		expect( sections.map( s => s.features.map( f => f.key ) ) ).toEqual( [
			[ 'writing_assistant' ],
			[ 'feature_clip' ],
		] );
	} );

	test( 'drops a row the endpoint marks unavailable', () => {
		const sections = visibleSections( SECTIONS, {
			writing_assistant: { enabled: true },
			excerpt: { enabled: false, available: false },
			feature_clip: { enabled: true, available: true },
		} );

		expect( sections.map( s => s.features.map( f => f.key ) ) ).toEqual( [
			[ 'writing_assistant' ],
			[ 'feature_clip' ],
		] );
	} );

	test( 'drops a section whose rows are all unreported', () => {
		const sections = visibleSections( SECTIONS, { writing_assistant: { enabled: true } } );

		expect( sections.map( s => s.key ) ).toEqual( [ 'content' ] );
	} );

	test( 'renders nothing from an empty response', () => {
		expect( visibleSections( SECTIONS, {} ) ).toEqual( [] );
	} );
} );
