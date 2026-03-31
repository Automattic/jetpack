import { renderHook, act } from '@testing-library/react';
import { usePosterAndTitleUpdate } from '../uploader-progress.js';

const mockUploadPoster = jest.fn();
const mockGetPoster = jest.fn();
const mockUpdateMeta = jest.fn();
jest.mock( '../../../../../../hooks/use-poster-upload.js', () => () => mockUploadPoster );
jest.mock( '../../../../../../hooks/use-poster-image.js', () => () => mockGetPoster );
jest.mock( '../../../../../../hooks/use-meta-update.js', () => () => mockUpdateMeta );
jest.mock(
	'@wordpress/api-fetch',
	() =>
		( ...args ) =>
			mockApiFetch( ...args )
);

// Declared after jest.mock calls because @wordpress/api-fetch mock needs a lazy reference.
const mockApiFetch = jest.fn();
jest.mock( '@wordpress/compose', () => ( {
	useDebounce: fn => {
		const debounced = ( ...args ) => fn( ...args );
		debounced.cancel = jest.fn(); // eslint-disable-line jest/prefer-spy-on
		return debounced;
	},
	createHigherOrderComponent: () => c => c,
} ) );
jest.mock( '@wordpress/components', () => ( {
	Button: () => null,
	TextControl: () => null,
} ) );
jest.mock( '@wordpress/escape-html', () => ( {
	escapeHTML: s => s,
} ) );
jest.mock( '@wordpress/i18n', () => ( {
	__: s => s,
	sprintf: ( ...args ) => args.join( '' ),
} ) );
jest.mock( 'debug', () => () => () => {} );
jest.mock( 'filesize', () => ( { filesize: () => '0 B' } ) );
jest.mock( '../uploader-editor.js', () => () => null );
jest.mock( '../../../edit', () => ( {
	PlaceholderWrapper: () => null,
} ) );

describe( 'usePosterAndTitleUpdate', () => {
	let setAttributes;
	let onDone;
	const videoData = { id: 1, guid: 'abc123', src: 'https://example.com/video.mp4' };

	beforeEach( () => {
		jest.clearAllMocks();
		setAttributes = jest.fn();
		onDone = jest.fn();
		mockUpdateMeta.mockResolvedValue( {} );
		mockUploadPoster.mockResolvedValue( { data: {} } );
	} );

	const renderTestHook = ( overrides = {} ) => {
		return renderHook( () =>
			usePosterAndTitleUpdate( {
				setAttributes,
				videoData,
				onDone,
				...overrides,
			} )
		);
	};

	const getHookValues = result => {
		const [
			handleVideoFrameSelected,
			handleSelectPoster,
			handleRemovePoster,
			handleDoneUpload,
			videoPosterImageData,
			isFinishingUpdate,
			hasPosterEdits,
			videoRef,
		] = result.current;

		return {
			handleVideoFrameSelected,
			handleSelectPoster,
			handleRemovePoster,
			handleDoneUpload,
			videoPosterImageData,
			isFinishingUpdate,
			hasPosterEdits,
			videoRef,
		};
	};

	it( 'calls onDone with videoData when no poster edits are made', async () => {
		const { result } = renderTestHook();

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
		} );

		expect( onDone ).toHaveBeenCalledWith( videoData );
	} );

	it( 'includes client-side poster URL in onDone when a poster image is selected', async () => {
		const { result } = renderTestHook();

		act( () => {
			getHookValues( result ).handleSelectPoster( {
				id: 42,
				url: 'https://example.com/image.jpg',
			} );
		} );

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
		} );

		// Server-side poster update fires in background.
		expect( mockUploadPoster ).toHaveBeenCalledWith( { poster_attachment_id: 42 } );
		// onDone uses the client-side URL immediately.
		expect( onDone ).toHaveBeenCalledWith( {
			...videoData,
			poster: 'https://example.com/image.jpg',
		} );
	} );

	it( 'captures frame client-side and uploads as poster on Done', async () => {
		const posterUrl = 'https://example.com/wp-content/uploads/poster.jpg';
		const fakeBlob = new Blob( [ 'fake' ], { type: 'image/jpeg' } );

		// Mock the media upload response.
		mockApiFetch.mockResolvedValue( { id: 99, source_url: posterUrl } );

		const { result } = renderTestHook();
		const { videoRef } = getHookValues( result );

		// Simulate a video element with capturable dimensions.
		videoRef.current = {
			videoWidth: 640,
			videoHeight: 360,
		};

		// Mock canvas and toBlob globally for captureVideoFrame.
		const mockToBlob = jest.fn( cb => cb( fakeBlob ) );
		const mockGetContext = jest.fn( () => ( { drawImage: jest.fn() } ) );
		jest.spyOn( document, 'createElement' ).mockReturnValue( {
			width: 0,
			height: 0,
			getContext: mockGetContext,
			toBlob: mockToBlob,
		} );

		act( () => {
			getHookValues( result ).handleVideoFrameSelected( 5000 );
		} );

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
			await Promise.resolve();
			await Promise.resolve();
		} );

		// Should upload via WP media API, not the VideoPress poster endpoint.
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: '/wp/v2/media',
				method: 'POST',
			} )
		);
		expect( mockUploadPoster ).not.toHaveBeenCalled();
		expect( onDone ).toHaveBeenCalledWith( {
			...videoData,
			poster: posterUrl,
		} );

		document.createElement.mockRestore();
	} );

	it( 'handles frame capture at 0ms', async () => {
		const posterUrl = 'https://example.com/wp-content/uploads/poster.jpg';
		const fakeBlob = new Blob( [ 'fake' ], { type: 'image/jpeg' } );

		mockApiFetch.mockResolvedValue( { id: 99, source_url: posterUrl } );

		const { result } = renderTestHook();
		const { videoRef } = getHookValues( result );

		videoRef.current = { videoWidth: 640, videoHeight: 360 };

		const mockToBlob = jest.fn( cb => cb( fakeBlob ) );
		jest.spyOn( document, 'createElement' ).mockReturnValue( {
			width: 0,
			height: 0,
			getContext: jest.fn( () => ( { drawImage: jest.fn() } ) ),
			toBlob: mockToBlob,
		} );

		act( () => {
			getHookValues( result ).handleVideoFrameSelected( 0 );
		} );

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
			await Promise.resolve();
			await Promise.resolve();
		} );

		expect( onDone ).toHaveBeenCalledWith( {
			...videoData,
			poster: posterUrl,
		} );

		document.createElement.mockRestore();
	} );

	it( 'falls back to onDone without poster when frame capture fails', async () => {
		mockApiFetch.mockRejectedValue( new Error( 'upload failed' ) );

		const { result } = renderTestHook();
		const { videoRef } = getHookValues( result );

		videoRef.current = { videoWidth: 640, videoHeight: 360 };

		jest.spyOn( document, 'createElement' ).mockReturnValue( {
			width: 0,
			height: 0,
			getContext: jest.fn( () => ( { drawImage: jest.fn() } ) ),
			toBlob: jest.fn( cb => cb( new Blob( [ 'fake' ] ) ) ),
		} );

		act( () => {
			getHookValues( result ).handleVideoFrameSelected( 5000 );
		} );

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
			await Promise.resolve();
			await Promise.resolve();
		} );

		// Should fall back gracefully.
		expect( onDone ).toHaveBeenCalledWith( videoData );

		document.createElement.mockRestore();
	} );

	it( 'falls back to onDone without poster when toBlob returns null', async () => {
		const { result } = renderTestHook();
		const { videoRef } = getHookValues( result );

		videoRef.current = { videoWidth: 640, videoHeight: 360 };

		jest.spyOn( document, 'createElement' ).mockReturnValue( {
			width: 0,
			height: 0,
			getContext: jest.fn( () => ( { drawImage: jest.fn() } ) ),
			toBlob: jest.fn( cb => cb( null ) ),
		} );

		act( () => {
			getHookValues( result ).handleVideoFrameSelected( 5000 );
		} );

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
			await Promise.resolve();
			await Promise.resolve();
		} );

		expect( onDone ).toHaveBeenCalledWith( videoData );

		document.createElement.mockRestore();
	} );

	it( 'falls back to onDone without poster when videoRef is missing', async () => {
		const { result } = renderTestHook();

		// videoRef.current is null by default — don't set it.
		act( () => {
			getHookValues( result ).handleVideoFrameSelected( 5000 );
		} );

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
		} );

		expect( onDone ).toHaveBeenCalledWith( videoData );
	} );

	it( 'sets poster attribute via setAttributes when debounced update resolves', async () => {
		const posterUrl = 'https://example.com/poster.jpg';
		mockUploadPoster.mockResolvedValue( { data: { poster: posterUrl } } );

		const { result } = renderTestHook();

		act( () => {
			getHookValues( result ).handleSelectPoster( { id: 10 } );
		} );

		// The debounced useEffect fires sendUpdatePoster immediately (debounce is mocked).
		await act( async () => {
			await Promise.resolve();
		} );

		expect( setAttributes ).toHaveBeenCalledWith( { poster: posterUrl } );
	} );

	it( 'polls until poster generation completes', async () => {
		jest.useFakeTimers();

		const posterUrl = 'https://example.com/generated-poster.jpg';

		// First upload call returns generating state.
		mockUploadPoster.mockResolvedValue( { data: { generating: true } } );
		// Polling via getPosterImage returns the final poster.
		mockGetPoster.mockResolvedValue( { data: { poster: posterUrl } } );

		const { result } = renderTestHook();

		act( () => {
			getHookValues( result ).handleSelectPoster( { id: 10 } );
		} );

		// Flush the debounced useEffect call.
		await act( async () => {
			await Promise.resolve();
		} );

		// Advance past the polling setTimeout and flush resolved promises.
		await act( async () => {
			jest.advanceTimersByTime( 2000 );
			await Promise.resolve();
		} );

		expect( mockGetPoster ).toHaveBeenCalled();
		expect( setAttributes ).toHaveBeenCalledWith( { poster: posterUrl } );

		jest.useRealTimers();
	} );

	it( 'stops polling and resolves null after max retries', async () => {
		jest.useFakeTimers();

		// Upload and every poll return generating — never completes.
		mockUploadPoster.mockResolvedValue( { data: { generating: true } } );
		mockGetPoster.mockResolvedValue( { data: { generating: true } } );

		const { result } = renderTestHook();

		act( () => {
			getHookValues( result ).handleSelectPoster( { id: 10 } );
		} );

		// Flush the debounced useEffect call.
		await act( async () => {
			await Promise.resolve();
		} );

		// Advance through all 10 retries (10 × 2000ms).
		for ( let i = 0; i < 10; i++ ) {
			await act( async () => {
				jest.advanceTimersByTime( 2000 );
				await Promise.resolve();
			} );
		}

		// After exhausting retries, setAttributes should not have been
		// called with a poster (generating never resolved to a URL).
		expect( setAttributes ).not.toHaveBeenCalledWith(
			expect.objectContaining( { poster: expect.any( String ) } )
		);

		jest.useRealTimers();
	} );

	it( 'resolves with null when polling fails during poster generation', async () => {
		jest.useFakeTimers();

		// Upload returns generating, but polling rejects.
		mockUploadPoster.mockResolvedValue( { data: { generating: true } } );
		mockGetPoster.mockRejectedValue( new Error( 'polling failed' ) );
		mockApiFetch.mockRejectedValue( new Error( 'fallback failed' ) );

		const { result } = renderTestHook();

		act( () => {
			getHookValues( result ).handleSelectPoster( { id: 10 } );
		} );

		// Flush the debounced useEffect call.
		await act( async () => {
			await Promise.resolve();
		} );

		await act( async () => {
			jest.advanceTimersByTime( 2000 );
			await Promise.resolve();
		} );

		// Poster should not have been set via setAttributes.
		expect( setAttributes ).not.toHaveBeenCalledWith(
			expect.objectContaining( { poster: expect.any( String ) } )
		);

		jest.useRealTimers();
	} );

	it( 'falls back to apiFetch when poster upload hook rejects', async () => {
		const posterUrl = 'https://example.com/fallback-poster.jpg';
		mockUploadPoster.mockRejectedValue( new Error( 'hook failed' ) );
		mockApiFetch.mockResolvedValue( { poster: posterUrl } );

		const { result } = renderTestHook();

		act( () => {
			getHookValues( result ).handleSelectPoster( { id: 10 } );
		} );

		// Flush the debounced useEffect call and its fallback.
		await act( async () => {
			await Promise.resolve();
			await Promise.resolve();
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				method: 'POST',
				data: { poster_attachment_id: 10 },
			} )
		);
		expect( setAttributes ).toHaveBeenCalledWith( { poster: posterUrl } );
	} );

	it( 'calls onDone without poster after handleRemovePoster', async () => {
		const { result } = renderTestHook();

		act( () => {
			getHookValues( result ).handleSelectPoster( {
				id: 10,
				url: 'https://example.com/image.jpg',
			} );
		} );

		act( () => {
			getHookValues( result ).handleRemovePoster();
		} );

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
		} );

		expect( onDone ).toHaveBeenCalledWith( videoData );
	} );

	it( 'does not send poster update when guid is missing', async () => {
		const videoDataWithoutGuid = { id: 1 };
		const { result, rerender } = renderHook(
			( { vData } ) =>
				usePosterAndTitleUpdate( {
					setAttributes,
					videoData: vData,
					onDone,
				} ),
			{ initialProps: { vData: videoDataWithoutGuid } }
		);

		act( () => {
			getHookValues( result ).handleSelectPoster( {
				id: 42,
				url: 'https://example.com/image.jpg',
			} );
		} );

		// Attempt Done while guid is still missing — should be a no-op.
		await act( async () => {
			getHookValues( result ).handleDoneUpload();
		} );

		expect( mockUploadPoster ).not.toHaveBeenCalled();
		expect( onDone ).not.toHaveBeenCalled();

		// Simulate guid arriving (upload success).
		rerender( { vData: videoData } );

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
		} );

		expect( mockUploadPoster ).toHaveBeenCalledWith( { poster_attachment_id: 42 } );
		expect( onDone ).toHaveBeenCalledWith( {
			...videoData,
			poster: 'https://example.com/image.jpg',
		} );
	} );

	it( 'reports hasPosterEdits when poster image is selected', () => {
		const { result } = renderTestHook();

		expect( getHookValues( result ).hasPosterEdits ).toBe( false );

		act( () => {
			getHookValues( result ).handleSelectPoster( { id: 10 } );
		} );

		expect( getHookValues( result ).hasPosterEdits ).toBe( true );
	} );

	it( 'reports hasPosterEdits when video frame is selected', () => {
		const { result } = renderTestHook();

		act( () => {
			getHookValues( result ).handleVideoFrameSelected( 3000 );
		} );

		expect( getHookValues( result ).hasPosterEdits ).toBe( true );
	} );

	it( 'clears poster image data when video frame is selected', () => {
		const { result } = renderTestHook();

		act( () => {
			getHookValues( result ).handleSelectPoster( { id: 10 } );
		} );

		expect( getHookValues( result ).videoPosterImageData ).toEqual( { id: 10 } );

		act( () => {
			getHookValues( result ).handleVideoFrameSelected( 3000 );
		} );

		expect( getHookValues( result ).videoPosterImageData ).toBeNull();
	} );
} );
