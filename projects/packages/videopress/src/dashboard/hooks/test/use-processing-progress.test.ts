import { renderHook, act, waitFor } from '@testing-library/react';
import { io } from 'socket.io-client';
import { fetchVideoItem } from '../../../client/lib/fetch-video-item';
import {
	useProcessingProgress,
	__resetProcessingProgressForTests,
} from '../use-processing-progress';

jest.mock( 'socket.io-client', () => ( {
	io: jest.fn(),
} ) );

jest.mock( '../../../client/lib/fetch-video-item', () => ( {
	fetchVideoItem: jest.fn(),
} ) );

const mockedIo = io as unknown as jest.Mock;
const mockedFetchVideoItem = fetchVideoItem as unknown as jest.Mock;

type ConversionStatusEvent = { type: string; progress: number };
type Handler = ( data: ConversionStatusEvent ) => void;

type FakeSocket = {
	on: jest.Mock;
	off: jest.Mock;
	disconnect: jest.Mock;
	emit: ( event: string, data: ConversionStatusEvent ) => void;
};

/**
 * Build a fake socket.io socket capturing `on`/`off` handlers so tests can
 * emit server events.
 *
 * @return The fake socket.
 */
function makeFakeSocket(): FakeSocket {
	const handlers = new Map< string, Set< Handler > >();
	return {
		on: jest.fn( ( event: string, handler: Handler ) => {
			const set = handlers.get( event ) ?? new Set< Handler >();
			set.add( handler );
			handlers.set( event, set );
		} ),
		off: jest.fn( ( event: string, handler: Handler ) => {
			handlers.get( event )?.delete( handler );
		} ),
		disconnect: jest.fn(),
		emit: ( event, data ) => {
			handlers.get( event )?.forEach( handler => handler( data ) );
		},
	};
}

let sockets: FakeSocket[];

beforeEach( () => {
	sockets = [];
	mockedIo.mockImplementation( () => {
		const socket = makeFakeSocket();
		sockets.push( socket );
		return socket;
	} );
	// Default: a standard video with no dvd rendition.
	mockedFetchVideoItem.mockResolvedValue( { files_status: { std: { mp4: 'PROCESSING' } } } );
} );

afterEach( () => {
	__resetProcessingProgressForTests();
	jest.clearAllMocks();
} );

/**
 * Wait for the shared store to finish the video-info fetch and open its
 * socket connection.
 *
 * @return The connected fake socket.
 */
async function waitForSocket(): Promise< FakeSocket > {
	await waitFor( () => expect( mockedIo ).toHaveBeenCalled() );
	return sockets[ sockets.length - 1 ];
}

describe( 'useProcessingProgress', () => {
	it( 'stays inert while disabled', () => {
		const { result } = renderHook( () => useProcessingProgress( 'abc123', false, false ) );

		expect( result.current ).toBeNull();
		expect( mockedFetchVideoItem ).not.toHaveBeenCalled();
		expect( mockedIo ).not.toHaveBeenCalled();
	} );

	it( 'connects to the progress socket for the video guid', async () => {
		renderHook( () => useProcessingProgress( 'abc123', false, true ) );

		await waitForSocket();

		expect( mockedFetchVideoItem ).toHaveBeenCalledWith( { guid: 'abc123', isPrivate: false } );
		expect( mockedIo ).toHaveBeenCalledWith( 'https://io.videopress.com', {
			upgrade: false,
			query: { guid: 'abc123' },
		} );
	} );

	it( 'reports floored std_mp4 progress and ignores untracked filetypes', async () => {
		const { result } = renderHook( () => useProcessingProgress( 'abc123', false, true ) );
		const socket = await waitForSocket();

		expect( result.current ).toBeNull();

		act( () => socket.emit( 'conversion status', { type: 'std_mp4', progress: 33.7 } ) );
		expect( result.current ).toBe( 33 );

		// dvd_mp4 is not tracked for a standard video.
		act( () => socket.emit( 'conversion status', { type: 'dvd_mp4', progress: 90 } ) );
		expect( result.current ).toBe( 33 );
	} );

	it( 'tracks dvd_mp4 when the video has a dvd rendition', async () => {
		mockedFetchVideoItem.mockResolvedValue( { files_status: { dvd: { mp4: 'PROCESSING' } } } );

		const { result } = renderHook( () => useProcessingProgress( 'dvd456', false, true ) );
		const socket = await waitForSocket();

		act( () => socket.emit( 'conversion status', { type: 'std_mp4', progress: 90 } ) );
		expect( result.current ).toBeNull();

		act( () => socket.emit( 'conversion status', { type: 'dvd_mp4', progress: 60 } ) );
		expect( result.current ).toBe( 60 );
	} );

	it( 'clamps negative progress reports to zero', async () => {
		const { result } = renderHook( () => useProcessingProgress( 'abc123', false, true ) );
		const socket = await waitForSocket();

		act( () => socket.emit( 'conversion status', { type: 'std_mp4', progress: -1 } ) );
		expect( result.current ).toBe( 0 );
	} );

	it( 'disconnects the socket once conversion reaches 100', async () => {
		const { result } = renderHook( () => useProcessingProgress( 'abc123', false, true ) );
		const socket = await waitForSocket();

		act( () => socket.emit( 'conversion status', { type: 'std_mp4', progress: 100 } ) );

		expect( result.current ).toBe( 100 );
		expect( socket.off ).toHaveBeenCalledWith( 'conversion status', expect.any( Function ) );
		expect( socket.disconnect ).toHaveBeenCalled();
	} );

	it( 'falls back to std_mp4 when the video info request fails', async () => {
		mockedFetchVideoItem.mockRejectedValue( new Error( 'not ready' ) );

		const { result } = renderHook( () => useProcessingProgress( 'abc123', false, true ) );
		const socket = await waitForSocket();

		act( () => socket.emit( 'conversion status', { type: 'std_mp4', progress: 50 } ) );
		expect( result.current ).toBe( 50 );
	} );

	it( 'shares one socket between subscribers of the same guid', async () => {
		const { result: firstResult } = renderHook( () =>
			useProcessingProgress( 'abc123', false, true )
		);
		const { result: secondResult } = renderHook( () =>
			useProcessingProgress( 'abc123', false, true )
		);
		const socket = await waitForSocket();

		expect( mockedIo ).toHaveBeenCalledTimes( 1 );

		act( () => socket.emit( 'conversion status', { type: 'std_mp4', progress: 25 } ) );
		expect( firstResult.current ).toBe( 25 );
		expect( secondResult.current ).toBe( 25 );
	} );

	it( 'disconnects when the last subscriber unmounts', async () => {
		const { unmount: unmountFirst } = renderHook( () =>
			useProcessingProgress( 'abc123', false, true )
		);
		const { unmount: unmountSecond } = renderHook( () =>
			useProcessingProgress( 'abc123', false, true )
		);
		const socket = await waitForSocket();

		unmountFirst();
		expect( socket.disconnect ).not.toHaveBeenCalled();

		unmountSecond();
		expect( socket.disconnect ).toHaveBeenCalled();
	} );
} );
