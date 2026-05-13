import { renderHook, act, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import useAiAnswersSettings, { DEFAULT_PERSONALITY } from '../use-ai-answers-settings';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const SETTINGS_KEY = 'jetpack_search_ai_behavior_instructions';

const BLOCK_NAME = 'jetpack/search-ai-summary';

const makePost = ( overrides = {} ) => ( {
	id: 42,
	guideline_categories: {
		blocks: { [ BLOCK_NAME ]: { guidelines: 'Be concise.' } },
	},
	...overrides,
} );

describe( 'useAiAnswersSettings', () => {
	afterEach( () => {
		jest.resetAllMocks();
	} );

	describe( 'initial load — guidelines endpoint available', () => {
		it( 'starts in loading state', () => {
			apiFetch.mockReturnValue( new Promise( () => {} ) );
			const { result } = renderHook( () => useAiAnswersSettings() );
			expect( result.current.isLoading ).toBe( true );
			expect( result.current.content ).toBe( '' );
			expect( result.current.postId ).toBeNull();
			expect( result.current.error ).toBeNull();
			expect( result.current.isUnavailable ).toBe( false );
		} );

		it( 'sets content and postId from fetched post', async () => {
			apiFetch.mockResolvedValue( [ makePost() ] );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
			expect( result.current.postId ).toBe( 42 );
			expect( result.current.content ).toBe( 'Be concise.' );
		} );

		it( 'accepts a single post object (not an array)', async () => {
			apiFetch.mockResolvedValue( makePost( { id: 7 } ) );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
			expect( result.current.postId ).toBe( 7 );
		} );

		it( 'leaves content empty when post has no guidelines', async () => {
			apiFetch.mockResolvedValue( [ makePost( { guideline_categories: { blocks: {} } } ) ] );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
			expect( result.current.content ).toBe( '' );
		} );

		it( 'leaves content empty when no guidelines post exists', async () => {
			apiFetch.mockResolvedValue( { id: 0, guideline_categories: {} } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
			expect( result.current.content ).toBe( '' );
			expect( result.current.postId ).toBeNull();
		} );

		it( 'sets error on generic fetch failure', async () => {
			apiFetch.mockRejectedValue( { message: 'Network failure' } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
			expect( result.current.error ).toBe( 'Network failure' );
			expect( result.current.isUnavailable ).toBe( false );
		} );
	} );

	describe( 'initial load — guidelines endpoint absent, settings fallback', () => {
		it( 'falls back to /wp/v2/settings on rest_no_route', async () => {
			apiFetch
				.mockRejectedValueOnce( { code: 'rest_no_route' } )
				.mockResolvedValueOnce( { [ SETTINGS_KEY ]: 'Answer in French.' } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
			expect( result.current.content ).toBe( 'Answer in French.' );
			expect( result.current.isUnavailable ).toBe( false );
		} );

		it( 'falls back to /wp/v2/settings on 404 status error', async () => {
			apiFetch
				.mockRejectedValueOnce( { data: { status: 404 } } )
				.mockResolvedValueOnce( { [ SETTINGS_KEY ]: 'Be brief.' } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
			expect( result.current.content ).toBe( 'Be brief.' );
			expect( result.current.isUnavailable ).toBe( false );
		} );

		it( 'leaves content empty when option is not set', async () => {
			apiFetch.mockRejectedValueOnce( { code: 'rest_no_route' } ).mockResolvedValueOnce( {} );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
			expect( result.current.content ).toBe( '' );
		} );

		it( 'sets isUnavailable when both endpoints fail', async () => {
			apiFetch
				.mockRejectedValueOnce( { code: 'rest_no_route' } )
				.mockRejectedValueOnce( { message: 'Settings unavailable' } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
			expect( result.current.isUnavailable ).toBe( true );
			expect( result.current.error ).toBeNull();
		} );
	} );

	describe( 'savePersonality — guidelines path', () => {
		it( 'POSTs when postId is null', async () => {
			apiFetch.mockResolvedValueOnce( { id: 0 } ).mockResolvedValueOnce( { id: 99 } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

			await act( async () => result.current.savePersonality() );

			const saveCall = apiFetch.mock.calls[ 1 ][ 0 ];
			expect( saveCall.method ).toBe( 'POST' );
			expect( saveCall.path ).toBe( '/wp/v2/content-guidelines' );
		} );

		it( 'PATCHes when postId exists', async () => {
			apiFetch.mockResolvedValueOnce( makePost() ).mockResolvedValueOnce( { id: 42 } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

			await act( async () => result.current.savePersonality() );

			const saveCall = apiFetch.mock.calls[ 1 ][ 0 ];
			expect( saveCall.method ).toBe( 'PATCH' );
			expect( saveCall.path ).toBe( '/wp/v2/content-guidelines/42' );
		} );

		it( 'sets saved and updates postId on success', async () => {
			apiFetch.mockResolvedValueOnce( { id: 0 } ).mockResolvedValueOnce( { id: 55 } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

			await act( async () => result.current.savePersonality() );

			expect( result.current.saved ).toBe( true );
			expect( result.current.postId ).toBe( 55 );
			expect( result.current.isSaving ).toBe( false );
		} );

		it( 'sets error on save failure', async () => {
			apiFetch
				.mockResolvedValueOnce( { id: 0 } )
				.mockRejectedValueOnce( { message: 'Save failed' } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

			await act( async () => result.current.savePersonality() );

			expect( result.current.error ).toBe( 'Save failed' );
			expect( result.current.saved ).toBe( false );
			expect( result.current.isSaving ).toBe( false );
		} );

		it( 'sends DEFAULT_PERSONALITY when content is empty', async () => {
			apiFetch.mockResolvedValueOnce( { id: 0 } ).mockResolvedValueOnce( { id: 1 } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

			await act( async () => result.current.savePersonality() );

			const saveCall = apiFetch.mock.calls[ 1 ][ 0 ];
			expect( saveCall.data.guideline_categories.blocks[ BLOCK_NAME ].guidelines ).toBe(
				DEFAULT_PERSONALITY
			);
		} );

		it( 'sends user content when content is non-empty', async () => {
			apiFetch.mockResolvedValueOnce( makePost() ).mockResolvedValueOnce( { id: 42 } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

			act( () => result.current.setContent( 'Custom instructions.' ) );
			await act( async () => result.current.savePersonality() );

			const saveCall = apiFetch.mock.calls[ 1 ][ 0 ];
			expect( saveCall.data.guideline_categories.blocks[ BLOCK_NAME ].guidelines ).toBe(
				'Custom instructions.'
			);
		} );
	} );

	describe( 'savePersonality — settings fallback path', () => {
		const setupSettingsFallback = async () => {
			apiFetch
				.mockRejectedValueOnce( { code: 'rest_no_route' } )
				.mockResolvedValueOnce( { [ SETTINGS_KEY ]: 'Be concise.' } );
			const utils = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( utils.result.current.isLoading ).toBe( false ) );
			return utils;
		};

		it( 'POSTs to /wp/v2/settings', async () => {
			const { result } = await setupSettingsFallback();
			apiFetch.mockResolvedValueOnce( {} );

			await act( async () => result.current.savePersonality() );

			const saveCall = apiFetch.mock.calls[ 2 ][ 0 ];
			expect( saveCall.method ).toBe( 'POST' );
			expect( saveCall.path ).toBe( '/wp/v2/settings' );
			expect( saveCall.data[ SETTINGS_KEY ] ).toBe( 'Be concise.' );
		} );

		it( 'sends DEFAULT_PERSONALITY when content is empty', async () => {
			apiFetch
				.mockRejectedValueOnce( { code: 'rest_no_route' } )
				.mockResolvedValueOnce( {} )
				.mockResolvedValueOnce( {} );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

			await act( async () => result.current.savePersonality() );

			const saveCall = apiFetch.mock.calls[ 2 ][ 0 ];
			expect( saveCall.data[ SETTINGS_KEY ] ).toBe( DEFAULT_PERSONALITY );
		} );

		it( 'sets saved on success', async () => {
			const { result } = await setupSettingsFallback();
			apiFetch.mockResolvedValueOnce( {} );

			await act( async () => result.current.savePersonality() );

			expect( result.current.saved ).toBe( true );
			expect( result.current.isSaving ).toBe( false );
		} );

		it( 'sets error on save failure', async () => {
			const { result } = await setupSettingsFallback();
			apiFetch.mockRejectedValueOnce( { message: 'Settings save failed' } );

			await act( async () => result.current.savePersonality() );

			expect( result.current.error ).toBe( 'Settings save failed' );
			expect( result.current.saved ).toBe( false );
		} );
	} );
} );
