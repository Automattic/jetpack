import { act, render, renderHook, screen } from '@testing-library/react';
import {
	useSaveVideoCopy,
	useVideoCopyStatus,
	VideoCopyRejectedError,
} from '../../../hooks/use-save-video-copy';
import { EditsConflictError } from '../../../hooks/use-save-video-edits';
import CopyStatusBanner from '../copy-status-banner';
import { useCopySession } from '../use-copy-session';
import type { SaveVideoCopyResponse, SaveVideoCopyVars } from '../../../hooks/use-save-video-copy';

jest.mock( '../../../hooks/use-save-video-copy', () => ( {
	...jest.requireActual( '../../../hooks/use-save-video-copy' ),
	useSaveVideoCopy: jest.fn(),
	useVideoCopyStatus: jest.fn(),
} ) );

const mutate = jest.fn();
const refetch = jest.fn();
const request: SaveVideoCopyVars = {
	guid: 'source12',
	baseRevision: 2,
	operations: [ { type: 'cut', start_ms: 3000, end_ms: 5000 } ],
	requestId: '32457391-3ebf-4c67-ac58-a34dd71399bf',
	title: 'Video copy',
};
const accepted: SaveVideoCopyResponse = {
	source_guid: request.guid,
	request_id: request.requestId,
	guid: null,
	attachment_id: null,
	job: { id: 'copy-job', status: 'processing', target_revision: null, progress: null, error: null },
};
let status: SaveVideoCopyResponse | undefined;

beforeEach( () => {
	jest.clearAllMocks();
	status = undefined;
	mutate.mockResolvedValue( accepted );
	jest.mocked( useSaveVideoCopy ).mockReturnValue( { mutateAsync: mutate } as never );
	jest.mocked( useVideoCopyStatus ).mockImplementation(
		( guid, requestId ) =>
			( {
				data: requestId ? status : undefined,
				refetch,
			} ) as never
	);
} );

describe( 'useCopySession', () => {
	it.each( [ 'copy_storage_limit', 'copy_authorization_unavailable' ] )(
		'unlocks a rejected %s request without polling and allows saving the preserved draft again',
		async code => {
			const failure = new VideoCopyRejectedError( code, 'Cannot create a copy.' );
			mutate.mockRejectedValueOnce( failure );
			const { result } = renderHook( () => useCopySession( request.guid ) );
			await act( async () => result.current.submit( request ) );
			expect( result.current.rejected ).toBe( true );
			expect( result.current.locked ).toBe( false );
			expect( useVideoCopyStatus ).toHaveBeenLastCalledWith( request.guid, null );
			expect( result.current.request?.operations ).toEqual( request.operations );
			act( () => result.current.clear() );
			expect( result.current.request ).toBeNull();
			const next = { ...request, requestId: 'another-copy' };
			await act( async () => result.current.submit( next ) );
			expect( mutate ).toHaveBeenLastCalledWith( next );
			expect( result.current.locked ).toBe( true );
		}
	);

	it.each( [
		new VideoCopyRejectedError( 'rest_cookie_invalid_nonce' ),
		new VideoCopyRejectedError( 'copy_authorization_unavailable' ),
		new EditsConflictError(),
	] )( 'keeps an uncertain request locked when a retry returns %s', async retryError => {
		mutate
			.mockRejectedValueOnce( new Error( 'Response interrupted' ) )
			.mockRejectedValueOnce( retryError );
		const { result } = renderHook( () => useCopySession( request.guid ) );
		await act( async () => result.current.submit( request ) );
		await act( async () => result.current.retry() );
		expect( result.current.rejected ).toBe( false );
		expect( result.current.conflict ).toBe( false );
		expect( result.current.locked ).toBe( true );
		expect( useVideoCopyStatus ).toHaveBeenLastCalledWith( request.guid, request.requestId );
		act( () => result.current.clear() );
		expect( result.current.request ).toBe( request );
	} );

	it( 'prevents duplicate submissions while the POST is unsettled', async () => {
		let resolve: ( value: SaveVideoCopyResponse ) => void;
		mutate.mockImplementation(
			() =>
				new Promise( resolveRequest => {
					resolve = resolveRequest;
				} )
		);
		const { result } = renderHook( () => useCopySession( request.guid ) );
		act( () => {
			void result.current.submit( request );
		} );
		expect( result.current.locked ).toBe( true );
		expect( result.current.submitting ).toBe( true );
		await act( async () => result.current.submit( { ...request, requestId: 'another-copy' } ) );
		expect( mutate ).toHaveBeenCalledTimes( 1 );
		await act( async () => resolve( accepted ) );
		expect( result.current.submitting ).toBe( false );
	} );

	it( 'does not replace an accepted processing request with a second copy', async () => {
		const { result, rerender } = renderHook( () => useCopySession( request.guid ) );
		await act( async () => result.current.submit( request ) );
		status = accepted;
		rerender();
		await act( async () => result.current.submit( { ...request, requestId: 'another-copy' } ) );
		expect( mutate ).toHaveBeenCalledTimes( 1 );
		expect( result.current.request?.requestId ).toBe( request.requestId );
	} );

	it( 'retains the exact request and source draft after an uncertain failure and retry', async () => {
		const sourceDraft = JSON.parse( JSON.stringify( request.operations ) );
		const failure = new Error( 'Response interrupted' );
		mutate.mockRejectedValueOnce( failure ).mockResolvedValueOnce( accepted );
		const { result } = renderHook( () => useCopySession( request.guid ) );
		await act( async () => result.current.submit( request ) );
		expect( result.current.error ).toBe( failure );
		expect( result.current.locked ).toBe( true );
		await act( async () => result.current.retry() );
		expect( mutate ).toHaveBeenNthCalledWith( 1, request );
		expect( mutate ).toHaveBeenNthCalledWith( 2, request );
		expect( request.operations ).toEqual( sourceDraft );
		expect( result.current.error ).toBeNull();
	} );

	it.each( [ 'failed', 'complete' ] as const )(
		'handles a terminal %s copy while preserving the request',
		async nextStatus => {
			const { result, rerender } = renderHook( () => useCopySession( request.guid ) );
			await act( async () => result.current.submit( request ) );
			status = accepted;
			rerender();
			expect( result.current.locked ).toBe( true );
			status = {
				...accepted,
				guid: nextStatus === 'complete' ? 'newcopy1' : null,
				attachment_id: nextStatus === 'complete' ? 17 : null,
				job: { ...accepted.job, status: nextStatus },
			};
			rerender();
			expect( result.current.locked ).toBe( nextStatus === 'complete' );
			expect( result.current.request ).toEqual( request );
		}
	);

	it( 'retries an unconfirmed remote attachment with the captured request while keeping edits locked', async () => {
		const { result, rerender } = renderHook( () => useCopySession( request.guid ) );
		await act( async () => result.current.submit( request ) );
		status = {
			...accepted,
			job: {
				...accepted.job,
				status: 'failed',
				error: { code: 'copy_attachment_unconfirmed', message: 'Attachment unconfirmed' },
			},
		};
		rerender();
		expect( result.current.recoverable ).toBe( true );
		expect( result.current.failed ).toBe( false );
		expect( result.current.locked ).toBe( true );
		act( () => result.current.clear() );
		expect( result.current.request ).toBe( request );
		await act( async () => result.current.retry() );
		expect( mutate ).toHaveBeenNthCalledWith( 2, request );
		expect( result.current.request?.operations ).toEqual( request.operations );
	} );

	it( 'preserves a pending attachment request without retrying and accepts a late completion', async () => {
		const { result, rerender } = renderHook( () => useCopySession( request.guid ) );
		await act( async () => result.current.submit( request ) );
		status = {
			...accepted,
			job: {
				...accepted.job,
				status: 'failed',
				error: { code: 'copy_attachment_pending', message: 'Attachment pending' },
			},
		};
		rerender();
		expect( result.current.needsAssistance ).toBe( true );
		expect( result.current.recoverable ).toBe( false );
		expect( result.current.failed ).toBe( false );
		expect( result.current.locked ).toBe( true );
		act( () => result.current.clear() );
		await act( async () => result.current.retry() );
		await act( async () => result.current.submit( { ...request, requestId: 'another-copy' } ) );
		expect( mutate ).toHaveBeenCalledTimes( 1 );
		expect( result.current.request ).toBe( request );
		expect( useVideoCopyStatus ).toHaveBeenLastCalledWith( request.guid, request.requestId );

		render( <CopyStatusBanner session={ result.current } onReload={ jest.fn() } /> );
		expect(
			screen.getByText( 'Your current video is unchanged.', {
				exact: false,
				ignore: '.a11y-speak-region, .a11y-speak-region *',
			} )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'contact support if it remains unconfirmed', {
				exact: false,
				ignore: '.a11y-speak-region, .a11y-speak-region *',
			} )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Dismiss' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Check status' } ) ).not.toBeInTheDocument();

		status = {
			...accepted,
			guid: 'newcopy1',
			attachment_id: 17,
			job: { ...accepted.job, status: 'complete' },
		};
		rerender();
		expect( result.current.needsAssistance ).toBe( false );
		expect( result.current.status.data?.guid ).toBe( 'newcopy1' );
	} );

	it( 'releases the lock and exposes a source revision conflict', async () => {
		mutate.mockRejectedValueOnce( new EditsConflictError() );
		const { result } = renderHook( () => useCopySession( request.guid ) );
		await act( async () => result.current.submit( request ) );
		expect( result.current.conflict ).toBe( true );
		expect( result.current.locked ).toBe( false );
		expect( result.current.request?.operations ).toEqual( request.operations );
	} );

	it( 'keeps tracking an accepted job when clear is called before it finishes', async () => {
		const { result, rerender } = renderHook( () => useCopySession( request.guid ) );
		await act( async () => result.current.submit( request ) );
		status = accepted;
		rerender();
		act( () => result.current.clear() );
		expect( result.current.request?.requestId ).toBe( request.requestId );
		expect( result.current.locked ).toBe( true );
	} );
} );
