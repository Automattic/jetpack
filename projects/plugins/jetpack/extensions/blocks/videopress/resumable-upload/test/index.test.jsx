import jetpackAnalytics from '@automattic/jetpack-analytics';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Upload } from 'tus-js-client';
import { VideoPressBlockContext } from '../../components';
import ResumableUpload from '../index';
import { getJWT, resumableUploader } from '../use-uploader';

jest.mock( '../use-uploader', () => ( { getJWT: jest.fn(), resumableUploader: jest.fn() } ) );
jest.mock( 'tus-js-client', () => jest.requireActual( 'tus-js-client/dist/tus.js' ) );
jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

const record = jetpackAnalytics.tracks.recordEvent;
const upload = jest.fn();

beforeEach( () => {
	jest.resetAllMocks();
	upload.mockReturnValue( { start: jest.fn(), abort: jest.fn() } );
	resumableUploader.mockReturnValue( upload );
} );

afterEach( () => jest.restoreAllMocks() );

/**
 * Render the editor uploader with its actual context.
 *
 * @return {object} Testing Library render result.
 */
function renderUpload() {
	return render(
		<VideoPressBlockContext.Provider value={ { onUploadFinished: jest.fn() } }>
			<ResumableUpload file={ new File( [ 'abc' ], 'private-name.mp4', { type: 'video/mp4' } ) } />
		</VideoPressBlockContext.Provider>
	);
}

it( 'includes token failures and retains logical identity when the user retries', async () => {
	getJWT
		.mockRejectedValueOnce( new Error( 'private failure detail' ) )
		.mockResolvedValueOnce( { token: 'token' } );
	const user = userEvent.setup();
	renderUpload();
	await user.click( await screen.findByRole( 'button', { name: 'Try again' } ) );
	await waitFor( () => expect( upload ).toHaveBeenCalledTimes( 1 ) );
	expect( record.mock.calls.map( ( [ name ] ) => name ) ).toEqual( [
		'jetpack_videopress_upload_started',
		'jetpack_videopress_upload_failed',
		'jetpack_videopress_upload_retried',
		'jetpack_videopress_upload_started',
	] );
	const properties = record.mock.calls.map( ( [ , value ] ) => value );
	expect( new Set( properties.map( value => value.upload_id ) ).size ).toBe( 1 );
	expect( properties.map( value => value.attempt ) ).toEqual( [ 1, 1, 2, 2 ] );
	expect( properties[ 1 ] ).toMatchObject( { source: 'block_editor', error_code: 'token_failed' } );
	expect( JSON.stringify( properties ) ).not.toContain( 'private' );
} );

it( 'does not create a transport when its token arrives after unmount', async () => {
	let resolve;
	getJWT.mockReturnValueOnce(
		new Promise( done => {
			resolve = done;
		} )
	);
	const { unmount } = renderUpload();
	unmount();
	await act( async () => resolve( { token: 'token' } ) );
	expect( upload ).not.toHaveBeenCalled();
	expect( record.mock.calls.map( ( [ name ] ) => name ) ).toEqual( [
		'jetpack_videopress_upload_started',
		'jetpack_videopress_upload_canceled',
	] );
} );

it( 'starts a new user attempt after a paused lookup fails without leaving the UI paused', async () => {
	let rejectLookup;
	jest
		.spyOn( Upload.prototype, 'findPreviousUploads' )
		.mockResolvedValue( [] )
		.mockReturnValueOnce(
			new Promise( ( resolve, reject ) => {
				rejectLookup = reject;
			} )
		);
	const start = jest.spyOn( Upload.prototype, 'start' ).mockImplementation( () => {} );
	jest.spyOn( Upload.prototype, 'abort' ).mockResolvedValue();
	resumableUploader.mockImplementation( jest.requireActual( '../use-uploader' ).resumableUploader );
	getJWT.mockResolvedValue( { token: 'token', url: 'https://example.com/uploads/' } );
	const user = userEvent.setup();
	renderUpload();
	await waitFor( () => expect( Upload.prototype.findPreviousUploads ).toHaveBeenCalledTimes( 1 ) );
	await user.click( screen.getByRole( 'button', { name: 'Pause' } ) );
	await act( async () => rejectLookup( new Error( 'lookup failed' ) ) );
	await user.click( await screen.findByRole( 'button', { name: 'Try again' } ) );
	await waitFor( () => expect( start ).toHaveBeenCalledTimes( 1 ) );
	expect( screen.getByRole( 'button', { name: 'Pause' } ) ).toBeInTheDocument();
	expect( record.mock.calls.map( ( [ name ] ) => name ) ).toEqual( [
		'jetpack_videopress_upload_started',
		'jetpack_videopress_upload_canceled',
		'jetpack_videopress_upload_failed',
		'jetpack_videopress_upload_retried',
		'jetpack_videopress_upload_started',
	] );
	expect( record.mock.calls[ 2 ][ 1 ] ).toMatchObject( {
		attempt: 1,
		error_code: 'resume_lookup_failed',
	} );
	expect( record.mock.calls[ 3 ][ 1 ] ).toMatchObject( { attempt: 2, retry_type: 'user' } );
} );
