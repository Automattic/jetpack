import { act, renderHook, waitFor } from '@testing-library/react';
import { pollGeneratingPosterImage, requestUpdatePosterByVideoFrame } from '../../../../lib/poster';
import { useVideoPosterData } from '../index';
import type { VideoBlockAttributes } from '../../../blocks/video/types';

const mockUseSelect = jest.fn();
const mockInvalidateResolution = jest.fn();

jest.mock( '@wordpress/core-data', () => ( { store: 'core-store' } ) );
jest.mock( '@wordpress/editor', () => ( { store: 'editor-store' } ) );
jest.mock( '@wordpress/data', () => ( {
	useSelect: ( ...args: unknown[] ) => mockUseSelect( ...args ),
	useDispatch: () => ( { invalidateResolution: mockInvalidateResolution } ),
} ) );
jest.mock( '../../../../lib/poster', () => ( {
	requestUpdatePosterByVideoFrame: jest.fn(),
	pollGeneratingPosterImage: jest.fn(),
} ) );
jest.mock( '../../../../lib/url', () => ( {
	getVideoPressUrl: ( guid: string ) => `https://videopress.com/v/${ guid }`,
} ) );

const mockUpdatePoster = jest.mocked( requestUpdatePosterByVideoFrame );
const mockPollPoster = jest.mocked( pollGeneratingPosterImage );
const initialAttributes: VideoBlockAttributes = {
	guid: 'pOsTeR01',
	posterData: { type: 'video-frame', atTime: 1000 },
};
const selectedFrame: VideoBlockAttributes = {
	...initialAttributes,
	posterData: { type: 'video-frame', atTime: 2000 },
};

/**
 * Render a frame selection followed by a completed post save.
 *
 * @return {object} Hook rendering helpers.
 */
function renderThroughSave() {
	const utils = renderHook( attributes => useVideoPosterData( attributes ), {
		initialProps: initialAttributes,
	} );
	mockUseSelect.mockReturnValue( true );
	utils.rerender( selectedFrame );
	mockUseSelect.mockReturnValue( false );
	utils.rerender( selectedFrame );
	return utils;
}

beforeEach( () => {
	jest.resetAllMocks();
	mockUseSelect.mockReturnValue( false );
	mockUpdatePoster.mockResolvedValue( undefined );
	mockPollPoster.mockResolvedValue( true );
} );

it( 'waits for the update before polling and refreshes the preview after completion', async () => {
	let finishUpdate: () => void;
	mockUpdatePoster.mockReturnValue(
		new Promise( resolve => ( finishUpdate = () => resolve( undefined ) ) )
	);
	let finishPolling: () => void;
	mockPollPoster.mockReturnValue(
		new Promise( resolve => ( finishPolling = () => resolve( true ) ) )
	);
	const { result } = renderThroughSave();

	expect( result.current.isGeneratingPoster ).toBe( true );
	expect( mockUpdatePoster ).toHaveBeenCalledWith( 'pOsTeR01', 2000 );
	expect( mockPollPoster ).not.toHaveBeenCalled();

	await act( async () => finishUpdate() );

	expect( mockPollPoster ).toHaveBeenCalledWith( 'pOsTeR01' );
	expect( result.current.isGeneratingPoster ).toBe( true );
	expect( mockInvalidateResolution ).not.toHaveBeenCalled();
	await act( async () => result.current.retryPosterGeneration() );
	expect( mockUpdatePoster ).toHaveBeenCalledTimes( 1 );

	await act( async () => finishPolling() );

	expect( result.current.isGeneratingPoster ).toBe( false );
	expect( result.current.posterError ).toBeNull();
	expect( mockInvalidateResolution ).toHaveBeenCalledWith( 'getEmbedPreview', [
		'https://videopress.com/v/pOsTeR01',
	] );
} );

it( 'explains a missing attachment, stops generation, and retries the same frame', async () => {
	mockUpdatePoster.mockRejectedValueOnce( { code: 'videopress_attachment_not_found' } );
	const { result } = renderThroughSave();

	await waitFor( () => expect( result.current.isGeneratingPoster ).toBe( false ) );
	expect( result.current.posterError ).toContain( 'Restore it from the trash' );
	expect( mockPollPoster ).not.toHaveBeenCalled();
	expect( mockInvalidateResolution ).not.toHaveBeenCalled();

	await act( async () => result.current.retryPosterGeneration() );

	expect( mockUpdatePoster ).toHaveBeenCalledTimes( 2 );
	expect( mockUpdatePoster ).toHaveBeenLastCalledWith( 'pOsTeR01', 2000 );
	expect( result.current.posterError ).toBeNull();
	expect( result.current.isGeneratingPoster ).toBe( false );
	expect( mockInvalidateResolution ).toHaveBeenCalledTimes( 1 );
} );

it.each( [ 'update', 'poll', 'timeout' ] )(
	'handles a %s failure and permits retry',
	async failure => {
		if ( failure === 'update' ) {
			mockUpdatePoster.mockRejectedValueOnce( { code: 'rest_forbidden' } );
		} else {
			mockPollPoster.mockRejectedValueOnce(
				new Error( failure === 'timeout' ? 'Poster generation timed out' : 'Network error' )
			);
		}
		const { result } = renderThroughSave();

		await waitFor( () => expect( result.current.isGeneratingPoster ).toBe( false ) );
		expect( result.current.posterError ).toBe(
			'Could not generate the video poster image. Please try again.'
		);
		expect( mockInvalidateResolution ).not.toHaveBeenCalled();

		await act( async () => result.current.retryPosterGeneration() );

		expect( result.current.posterError ).toBeNull();
		expect( mockInvalidateResolution ).toHaveBeenCalledTimes( 1 );
	}
);

it( 'retries a failed frame on the next save but does not regenerate a successful frame', async () => {
	mockUpdatePoster.mockRejectedValueOnce( new Error( 'Network error' ) );
	const { result, rerender } = renderThroughSave();
	await waitFor( () => expect( result.current.isGeneratingPoster ).toBe( false ) );

	mockUseSelect.mockReturnValue( true );
	rerender( selectedFrame );
	mockUseSelect.mockReturnValue( false );
	rerender( selectedFrame );
	await waitFor( () => expect( mockInvalidateResolution ).toHaveBeenCalledTimes( 1 ) );

	mockUseSelect.mockReturnValue( true );
	rerender( selectedFrame );
	mockUseSelect.mockReturnValue( false );
	rerender( selectedFrame );
	expect( mockUpdatePoster ).toHaveBeenCalledTimes( 2 );
} );

it( 'ignores a pending request when the video is replaced', async () => {
	let finishUpdate: () => void;
	mockUpdatePoster.mockReturnValue(
		new Promise( resolve => ( finishUpdate = () => resolve( undefined ) ) )
	);
	const { result, rerender } = renderThroughSave();
	rerender( { ...selectedFrame, guid: 'pOsTeR02' } );

	await act( async () => finishUpdate() );

	expect( mockPollPoster ).not.toHaveBeenCalled();
	expect( mockInvalidateResolution ).not.toHaveBeenCalled();
	expect( result.current.isGeneratingPoster ).toBe( false );
} );

it( 'ignores a rejected request after the block is removed', async () => {
	let failUpdate: () => void;
	mockUpdatePoster.mockReturnValue(
		new Promise(
			( resolve, reject ) => ( failUpdate = () => reject( new Error( 'Network error' ) ) )
		)
	);
	const { unmount } = renderThroughSave();
	unmount();

	await act( async () => failUpdate() );

	expect( mockPollPoster ).not.toHaveBeenCalled();
	expect( mockInvalidateResolution ).not.toHaveBeenCalled();
} );
