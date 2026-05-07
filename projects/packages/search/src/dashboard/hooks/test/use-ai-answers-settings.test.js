import { renderHook, act, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import useAiAnswersSettings, { DEFAULT_PERSONALITY } from '../use-ai-answers-settings';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const makePost = ( overrides = {} ) => ( {
	id: 42,
	guideline_categories: {
		blocks: {
			'jetpack/search-ai-summary': { guidelines: 'Be concise.' },
		},
	},
	...overrides,
} );

describe( 'useAiAnswersSettings', () => {
	afterEach( () => {
		jest.resetAllMocks();
	} );

	describe( 'initial load', () => {
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
			apiFetch.mockResolvedValue( [
				makePost( { guideline_categories: { blocks: { 'jetpack/search-ai-summary': {} } } } ),
			] );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
			expect( result.current.content ).toBe( '' );
		} );

		it( 'leaves content empty when no posts returned', async () => {
			apiFetch.mockResolvedValue( [] );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
			expect( result.current.content ).toBe( '' );
			expect( result.current.postId ).toBeNull();
		} );

		it( 'sets isUnavailable on rest_no_route error', async () => {
			apiFetch.mockRejectedValue( { code: 'rest_no_route' } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
			expect( result.current.isUnavailable ).toBe( true );
			expect( result.current.error ).toBeNull();
		} );

		it( 'sets isUnavailable on 404 status error', async () => {
			apiFetch.mockRejectedValue( { data: { status: 404 } } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
			expect( result.current.isUnavailable ).toBe( true );
		} );

		it( 'sets error on generic fetch failure', async () => {
			apiFetch.mockRejectedValue( { message: 'Network failure' } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
			expect( result.current.error ).toBe( 'Network failure' );
			expect( result.current.isUnavailable ).toBe( false );
		} );
	} );

	describe( 'savePersonality', () => {
		it( 'POSTs when postId is null', async () => {
			apiFetch.mockResolvedValueOnce( [] ).mockResolvedValueOnce( { id: 99 } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

			await act( async () => result.current.savePersonality() );

			const saveCall = apiFetch.mock.calls[ 1 ][ 0 ];
			expect( saveCall.method ).toBe( 'POST' );
			expect( saveCall.path ).toBe( '/wp/v2/guidelines' );
		} );

		it( 'PATCHes when postId exists', async () => {
			apiFetch.mockResolvedValueOnce( [ makePost() ] ).mockResolvedValueOnce( { id: 42 } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

			await act( async () => result.current.savePersonality() );

			const saveCall = apiFetch.mock.calls[ 1 ][ 0 ];
			expect( saveCall.method ).toBe( 'PATCH' );
			expect( saveCall.path ).toBe( '/wp/v2/guidelines/42' );
		} );

		it( 'sets saved and updates postId on success', async () => {
			apiFetch.mockResolvedValueOnce( [] ).mockResolvedValueOnce( { id: 55 } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

			await act( async () => result.current.savePersonality() );

			expect( result.current.saved ).toBe( true );
			expect( result.current.postId ).toBe( 55 );
			expect( result.current.isSaving ).toBe( false );
		} );

		it( 'sets error on save failure', async () => {
			apiFetch.mockResolvedValueOnce( [] ).mockRejectedValueOnce( { message: 'Save failed' } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

			await act( async () => result.current.savePersonality() );

			expect( result.current.error ).toBe( 'Save failed' );
			expect( result.current.saved ).toBe( false );
			expect( result.current.isSaving ).toBe( false );
		} );

		it( 'sends DEFAULT_PERSONALITY when content is empty', async () => {
			apiFetch.mockResolvedValueOnce( [] ).mockResolvedValueOnce( { id: 1 } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

			await act( async () => result.current.savePersonality() );

			const saveCall = apiFetch.mock.calls[ 1 ][ 0 ];
			expect(
				saveCall.data.guideline_categories.blocks[ 'jetpack/search-ai-summary' ].guidelines
			).toBe( DEFAULT_PERSONALITY );
		} );

		it( 'sends user content when content is non-empty', async () => {
			apiFetch.mockResolvedValueOnce( [ makePost() ] ).mockResolvedValueOnce( { id: 42 } );
			const { result } = renderHook( () => useAiAnswersSettings() );
			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

			act( () => result.current.setContent( 'Custom instructions.' ) );
			await act( async () => result.current.savePersonality() );

			const saveCall = apiFetch.mock.calls[ 1 ][ 0 ];
			expect(
				saveCall.data.guideline_categories.blocks[ 'jetpack/search-ai-summary' ].guidelines
			).toBe( 'Custom instructions.' );
		} );
	} );
} );
