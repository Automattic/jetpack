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
		image_editor: { enabled: false },
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

		const updated = {
			...SETTINGS,
			features: { ...SETTINGS.features, image_editor: { enabled: true } },
		};
		let request;
		// Async act: the POST dispatches from the save queue in a microtask.
		await act( async () => {
			request = result.current.updateSettings( { features: { image_editor: true } } );
		} );

		expect( result.current.savingKeys.has( 'image_editor' ) ).toBe( true );
		expect( result.current.savingKeys.has( 'writing_assistant' ) ).toBe( false );

		await act( async () => {
			resolvePost( updated );
			await request;
		} );

		expect( result.current.savingKeys.size ).toBe( 0 );
		expect( result.current.settings ).toEqual( updated );
		expect( apiFetch ).toHaveBeenLastCalledWith(
			expect.objectContaining( { method: 'POST', data: { features: { image_editor: true } } } )
		);
	} );

	test( 'a failed save keeps the view usable: no load error, prior settings, saving cleared', async () => {
		apiFetch.mockResolvedValueOnce( SETTINGS );
		const { result } = renderHook( () => useFeatureSettings() );
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		apiFetch.mockRejectedValueOnce( new Error( 'offline' ) );

		await act( async () => {
			await expect(
				result.current.updateSettings( { features: { image_editor: true } } )
			).rejects.toThrow( 'offline' );
		} );

		// The hook-level error means "settings could not be loaded" and hides
		// the whole Features view — a failed save must never set it. The caller
		// receives the rejection and shows its own dismissible notice.
		expect( result.current.error ).toBeNull();
		expect( result.current.settings ).toEqual( SETTINGS );
		expect( result.current.savingKeys.size ).toBe( 0 );

		// The toggles are still mounted, so retrying in place must work.
		const updated = {
			...SETTINGS,
			features: { ...SETTINGS.features, image_editor: { enabled: true } },
		};
		apiFetch.mockResolvedValueOnce( updated );

		await act( async () => {
			await result.current.updateSettings( { features: { image_editor: true } } );
		} );

		expect( result.current.settings ).toEqual( updated );
		expect( result.current.error ).toBeNull();
	} );

	test( 'serializes concurrent saves so a stale snapshot cannot clobber a later one', async () => {
		apiFetch.mockResolvedValueOnce( SETTINGS );
		const { result } = renderHook( () => useFeatureSettings() );
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		// Every POST response is a full settings snapshot: if both requests were
		// in flight together, the first response arriving last would revert the
		// second save on screen. The queue must hold the second POST back.
		const afterFirst = {
			...SETTINGS,
			features: { ...SETTINGS.features, writing_assistant: { enabled: false } },
		};
		const afterSecond = {
			...afterFirst,
			features: { ...afterFirst.features, image_editor: { enabled: true } },
		};
		let resolveFirst;
		apiFetch
			.mockReturnValueOnce( new Promise( resolve => ( resolveFirst = resolve ) ) )
			.mockResolvedValueOnce( afterSecond );

		let first, second;
		await act( async () => {
			first = result.current.updateSettings( { features: { writing_assistant: false } } );
			second = result.current.updateSettings( { features: { image_editor: true } } );
		} );

		// Both toggles report saving, but only the first POST is on the wire.
		expect( result.current.savingKeys.has( 'writing_assistant' ) ).toBe( true );
		expect( result.current.savingKeys.has( 'image_editor' ) ).toBe( true );
		expect( apiFetch ).toHaveBeenCalledTimes( 2 ); // The GET plus the first POST.

		await act( async () => {
			resolveFirst( afterFirst );
			await Promise.all( [ first, second ] );
		} );

		expect( apiFetch ).toHaveBeenCalledTimes( 3 );
		expect( apiFetch ).toHaveBeenLastCalledWith(
			expect.objectContaining( { method: 'POST', data: { features: { image_editor: true } } } )
		);
		expect( result.current.settings ).toEqual( afterSecond );
		expect( result.current.savingKeys.size ).toBe( 0 );
	} );

	test( 'a failed save does not block the save queued behind it', async () => {
		apiFetch.mockResolvedValueOnce( SETTINGS );
		const { result } = renderHook( () => useFeatureSettings() );
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		const updated = {
			...SETTINGS,
			features: { ...SETTINGS.features, image_editor: { enabled: true } },
		};
		apiFetch.mockRejectedValueOnce( new Error( 'offline' ) ).mockResolvedValueOnce( updated );

		await act( async () => {
			const first = result.current.updateSettings( { features: { writing_assistant: false } } );
			const second = result.current.updateSettings( { features: { image_editor: true } } );
			await expect( first ).rejects.toThrow( 'offline' );
			await second;
		} );

		// The queued save ran and its snapshot shows the failed toggle unchanged.
		expect( result.current.settings ).toEqual( updated );
		expect( result.current.savingKeys.size ).toBe( 0 );
		expect( result.current.error ).toBeNull();
	} );

	test( 'a master switch update is tracked under the __master__ key', async () => {
		apiFetch.mockResolvedValueOnce( SETTINGS );
		const { result } = renderHook( () => useFeatureSettings() );
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		let resolvePost;
		apiFetch.mockReturnValueOnce( new Promise( resolve => ( resolvePost = resolve ) ) );

		let request;
		// Async act: the POST dispatches from the save queue in a microtask.
		await act( async () => {
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
			features: [ { key: 'writing_assistant' }, { key: 'image_editor' } ],
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

	test( 'keeps a row that requires an upgrade (badge case, not hidden)', () => {
		const sections = visibleSections( [ { key: 'search', features: [ { key: 'ai_search' } ] } ], {
			ai_search: { enabled: false, requires_upgrade: true },
		} );

		expect( sections.map( s => s.key ) ).toEqual( [ 'search' ] );
	} );

	test( 'drops a row the endpoint marks unavailable', () => {
		const sections = visibleSections( SECTIONS, {
			writing_assistant: { enabled: true },
			image_editor: { enabled: false, available: false },
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
