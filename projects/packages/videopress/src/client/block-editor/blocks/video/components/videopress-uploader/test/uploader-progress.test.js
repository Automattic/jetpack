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
	useDebounce: fn => fn,
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
		] = result.current;

		return {
			handleVideoFrameSelected,
			handleSelectPoster,
			handleRemovePoster,
			handleDoneUpload,
			videoPosterImageData,
			isFinishingUpdate,
			hasPosterEdits,
		};
	};

	it( 'calls onDone with videoData when no poster edits are made', async () => {
		const { result } = renderTestHook();

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
		} );

		expect( onDone ).toHaveBeenCalledWith( videoData );
	} );

	it( 'includes poster URL in onDone data when a poster image is selected', async () => {
		const posterUrl = 'https://example.com/custom-poster.jpg';
		mockUploadPoster.mockResolvedValue( { data: { poster: posterUrl } } );

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

		expect( mockUploadPoster ).toHaveBeenCalledWith( { poster_attachment_id: 42 } );
		expect( onDone ).toHaveBeenCalledWith( {
			...videoData,
			poster: posterUrl,
		} );
	} );

	it( 'includes poster URL in onDone data when a video frame is selected', async () => {
		const posterUrl = 'https://example.com/frame-poster.jpg';
		mockUploadPoster.mockResolvedValue( { data: { poster: posterUrl } } );

		const { result } = renderTestHook();

		act( () => {
			getHookValues( result ).handleVideoFrameSelected( 5000 );
		} );

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
		} );

		expect( mockUploadPoster ).toHaveBeenCalledWith( {
			at_time: 5000,
			is_millisec: true,
		} );
		expect( onDone ).toHaveBeenCalledWith( {
			...videoData,
			poster: posterUrl,
		} );
	} );

	it( 'handles video frame selected at 0ms', async () => {
		const posterUrl = 'https://example.com/zero-frame.jpg';
		mockUploadPoster.mockResolvedValue( { data: { poster: posterUrl } } );

		const { result } = renderTestHook();

		act( () => {
			getHookValues( result ).handleVideoFrameSelected( 0 );
		} );

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
		} );

		expect( mockUploadPoster ).toHaveBeenCalledWith( {
			at_time: 0,
			is_millisec: true,
		} );
		expect( onDone ).toHaveBeenCalledWith( {
			...videoData,
			poster: posterUrl,
		} );
	} );

	it( 'sets poster attribute via setAttributes when poster resolves', async () => {
		const posterUrl = 'https://example.com/poster.jpg';
		mockUploadPoster.mockResolvedValue( { data: { poster: posterUrl } } );

		const { result } = renderTestHook();

		act( () => {
			getHookValues( result ).handleSelectPoster( { id: 10 } );
		} );

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
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

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
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

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
		} );

		// Advance through all 10 retries (10 × 2000ms).
		for ( let i = 0; i < 10; i++ ) {
			await act( async () => {
				jest.advanceTimersByTime( 2000 );
				await Promise.resolve();
			} );
		}

		// onDone should be called without poster after retries are exhausted.
		expect( onDone ).toHaveBeenCalledWith( videoData );

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

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
		} );

		await act( async () => {
			jest.advanceTimersByTime( 2000 );
			await Promise.resolve();
		} );

		// onDone should still be called (without poster) rather than hanging.
		expect( onDone ).toHaveBeenCalledWith( videoData );

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

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				method: 'POST',
				data: { poster_attachment_id: 10 },
			} )
		);
		expect( setAttributes ).toHaveBeenCalledWith( { poster: posterUrl } );
	} );

	it( 'calls onDone without poster when both upload paths reject', async () => {
		// Let the useEffect's debounced call succeed first, then set up rejections.
		mockUploadPoster.mockResolvedValueOnce( {
			data: { poster: 'https://example.com/poster.jpg' },
		} );

		const { result } = renderTestHook();

		act( () => {
			getHookValues( result ).handleSelectPoster( { id: 10 } );
		} );

		// Flush the useEffect's debounced call.
		await act( async () => {
			await Promise.resolve();
		} );

		// Reject once for handleDoneUpload's direct call, then restore
		// resolved defaults so the useEffect re-run after isFinishingUpdate
		// resets doesn't trigger unhandled rejections.
		mockUploadPoster
			.mockRejectedValueOnce( new Error( 'hook failed' ) )
			.mockResolvedValue( { data: {} } );
		mockApiFetch.mockRejectedValueOnce( new Error( 'fallback failed' ) ).mockResolvedValue( {} );

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
		} );

		expect( onDone ).toHaveBeenCalledWith( videoData );
	} );

	it( 'waits for title update alongside poster update', async () => {
		const posterUrl = 'https://example.com/poster.jpg';
		mockUploadPoster.mockResolvedValue( { data: { poster: posterUrl } } );

		let resolveMetaUpdate;
		mockUpdateMeta.mockReturnValue(
			new Promise( resolve => {
				resolveMetaUpdate = resolve;
			} )
		);

		const { result } = renderTestHook( {
			videoData: { ...videoData, title: 'My Video' },
		} );

		act( () => {
			getHookValues( result ).handleSelectPoster( { id: 10 } );
		} );

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
		} );

		// onDone should not have been called yet — title update is pending.
		expect( onDone ).not.toHaveBeenCalled();

		// Resolve the title update.
		await act( async () => {
			resolveMetaUpdate();
		} );

		expect( onDone ).toHaveBeenCalledWith( {
			...videoData,
			title: 'My Video',
			poster: posterUrl,
		} );
	} );

	it( 'does not include poster in onDone when poster update resolves with null', async () => {
		mockUploadPoster.mockResolvedValue( { data: {} } );

		const { result } = renderTestHook();

		act( () => {
			getHookValues( result ).handleSelectPoster( { id: 10 } );
		} );

		await act( async () => {
			getHookValues( result ).handleDoneUpload();
		} );

		expect( onDone ).toHaveBeenCalledWith( videoData );
	} );

	it( 'calls onDone without poster after handleRemovePoster', async () => {
		const { result } = renderTestHook();

		act( () => {
			getHookValues( result ).handleSelectPoster( { id: 10 } );
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
		const posterUrl = 'https://example.com/poster.jpg';
		mockUploadPoster.mockResolvedValue( { data: { poster: posterUrl } } );

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
			getHookValues( result ).handleSelectPoster( { id: 42 } );
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
			poster: posterUrl,
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
