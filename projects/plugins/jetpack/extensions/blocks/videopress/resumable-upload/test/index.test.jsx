import jetpackAnalytics from '@automattic/jetpack-analytics';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoPressBlockContext } from '../../components';
import ResumableUpload from '../index';
import { getJWT, resumableUploader } from '../use-uploader';

jest.mock( '../use-uploader', () => ( { getJWT: jest.fn(), resumableUploader: jest.fn() } ) );
jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

const record = jetpackAnalytics.tracks.recordEvent;
const upload = jest.fn();

beforeEach( () => {
	jest.clearAllMocks();
	upload.mockReturnValue( { start: jest.fn(), abort: jest.fn() } );
	resumableUploader.mockReturnValue( upload );
} );

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
