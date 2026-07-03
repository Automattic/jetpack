// Exercises the full attach orchestration against the REAL use-upload
// adapter: only the legacy tus uploader underneath it is mocked (same shape
// as use-upload.test.ts), so the per-item settler plumbing is covered too.
// REST traffic goes through the shared apiFetch mock.

import { act, renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import {
	AttachImportMediaError,
	importMetaToPatch,
	useAttachImportMedia,
} from '../use-attach-import-media';
import { LIBRARY_QUERY_KEY } from '../use-library';
import { __resetUploadStoreForTests } from '../use-upload';
import { IMPORT_QUERY_KEY } from '../use-youtube-connection';

const mockUploadHandler = jest.fn();
let lastCallbacks: {
	onProgress?: ( bytesSent: number, bytesTotal: number ) => void;
	onSuccess?: ( data?: unknown ) => void;
	onError?: ( err: unknown ) => void;
};

jest.mock( '../../../client/hooks/use-resumable-uploader', () => ( {
	__esModule: true,
	default: jest.fn( options => {
		lastCallbacks = options;
		return {
			onUploadHandler: jest.fn(),
			uploadHandler: mockUploadHandler,
			resumeHandler: undefined,
			uploadingData: { bytesSent: 0, bytesTotal: 0, percent: 0, status: 'idle' },
			media: undefined,
			error: null,
		};
	} ),
} ) );

const DRAFT_ID = 123;
const DRAFT_PATH = `/wp/v2/media/${ DRAFT_ID }`;
const META_PATH = '/wpcom/v2/videopress/meta';
const POSTER_PATH = '/wpcom/v2/videopress/guid-1/poster';
const COMPLETE_PATH = '/jetpack/v4/videopress/import/complete';

const UPLOADED_MEDIA = { id: 77, guid: 'guid-1', src: 'https://videos.example/src.mp4' };

const DRAFT_IMPORT_META = {
	source: 'youtube',
	external_id: 'vid-a',
	title: 'Imported title',
	description: 'Imported description',
	tags: [ 'travel' ],
	duration_seconds: 120,
	privacy: 'unlisted',
	published_at: '2026-05-18T14:00:00Z',
	thumbnail_url: 'https://i.ytimg.com/vi/vid-a/maxresdefault.jpg',
	thumbnail_attachment_id: 55,
	status: 'awaiting_media',
};

type ApiCall = { path?: string; method?: string; data?: unknown };

/**
 * Install an apiFetch handler covering every REST step of the happy path,
 * with per-path overrides for failure scenarios.
 *
 * @param overrides  - Map of path → handler; a matching path wins over the defaults.
 * @param importMeta - The draft's jetpack_videopress_import payload. Pass null
 *                   for a non-draft response (not undefined — that would
 *                   trigger the default parameter and serve a valid draft).
 * @return The chronological list of calls the handler received.
 */
function mockAttachApi(
	overrides: Record< string, ( options: ApiCall ) => unknown > = {},
	importMeta: unknown = DRAFT_IMPORT_META
): ApiCall[] {
	const calls: ApiCall[] = [];
	mockApiFetch( ( options: ApiCall ) => {
		calls.push( options );
		const override = options.path && overrides[ options.path ];
		if ( override ) {
			return override( options );
		}
		if ( options.path === DRAFT_PATH && ! options.method ) {
			return { id: DRAFT_ID, jetpack_videopress_import: importMeta ?? undefined };
		}
		if ( options.path === META_PATH && options.method === 'POST' ) {
			return {};
		}
		if ( options.path === POSTER_PATH && options.method === 'POST' ) {
			return { data: { generating: false, poster: 'https://videos.example/poster.jpg' } };
		}
		if ( options.path === COMPLETE_PATH && options.method === 'POST' ) {
			return { completed: true, media_id: 77 };
		}
		throw new Error( `Unexpected apiFetch call: ${ options.method ?? 'GET' } ${ options.path }` );
	} );
	return calls;
}

/**
 * Kick off the attach mutation and drive it until the tus upload is the next
 * pending step (the point where tests decide whether the upload succeeds).
 *
 * The pending promise is returned inside an object on purpose: returning it
 * directly from an async function would make `await startAttach(...)` flatten
 * onto the attach promise itself and deadlock waiting for an upload callback
 * the test hasn't fired yet.
 *
 * @param attach - The hook's attach function.
 * @return An object holding the pending attach promise.
 */
async function startAttach(
	attach: ( vars: { draftId: number; file: File } ) => Promise< unknown >
): Promise< { attachPromise: Promise< unknown > } > {
	const file = new File( [ 'bytes' ], 'export.mp4', { type: 'video/mp4' } );
	let attachPromise: Promise< unknown > = Promise.resolve();
	act( () => {
		attachPromise = attach( { draftId: DRAFT_ID, file } );
	} );
	// Park a handler so an early rejection never trips the unhandled-rejection
	// detector before the test asserts on the promise.
	attachPromise.catch( () => {} );
	await waitFor( () => expect( mockUploadHandler ).toHaveBeenCalledWith( file ) );
	return { attachPromise };
}

/**
 * Await a promise inside act() so the React state updates triggered by its
 * settlement (mutation status, uploadItemId) stay wrapped, and normalize the
 * outcome: the resolved value on success, the rejection reason on failure.
 *
 * @param promise - The promise to settle.
 * @return The resolved value or the rejection error.
 */
async function settleInAct( promise: Promise< unknown > ): Promise< unknown > {
	let outcome: unknown;
	await act( async () => {
		outcome = await promise.then(
			value => value,
			error => error
		);
	} );
	return outcome;
}

beforeEach( () => {
	mockUploadHandler.mockClear();
	lastCallbacks = {};
	__resetUploadStoreForTests();
} );

describe( 'importMetaToPatch', () => {
	it( 'maps title, description, and privacy (unlisted → private)', () => {
		expect( importMetaToPatch( DRAFT_IMPORT_META ) ).toEqual( {
			title: 'Imported title',
			description: 'Imported description',
			privacy: 'private',
		} );
	} );

	it( 'maps public → public and drops unknown privacy values', () => {
		expect( importMetaToPatch( { privacy: 'public' } ) ).toEqual( { privacy: 'public' } );
		expect( importMetaToPatch( { privacy: 'members-only' } ) ).toEqual( {} );
	} );

	it( 'omits empty fields entirely', () => {
		expect( importMetaToPatch( {} ) ).toEqual( {} );
		expect( importMetaToPatch( { title: '', description: '' } ) ).toEqual( {} );
	} );
} );

describe( 'useAttachImportMedia — happy path', () => {
	it( 'uploads, applies metadata and poster, deletes the draft, and invalidates caches', async () => {
		const calls = mockAttachApi();
		const client = createTestQueryClient();
		const invalidateSpy = jest.spyOn( client, 'invalidateQueries' );
		const { result } = renderHook( () => useAttachImportMedia(), {
			wrapper: createTestWrapper( client ),
		} );

		const { attachPromise } = await startAttach( result.current.attach );

		// The upload queue item is exposed for progress rendering.
		expect( result.current.uploadItemId ).toMatch( /^upload-/ );

		act( () => {
			lastCallbacks.onSuccess?.( UPLOADED_MEDIA );
		} );

		await expect( settleInAct( attachPromise ) ).resolves.toEqual( {
			mediaId: 77,
			guid: 'guid-1',
			posterApplied: true,
		} );

		// Stored metadata was applied through the existing meta path,
		// with YouTube "unlisted" conservatively mapped to private (1).
		const metaCall = calls.find(
			call =>
				call.path === META_PATH && ( call.data as { title?: string } )?.title === 'Imported title'
		);
		expect( metaCall?.data ).toEqual( {
			id: 77,
			title: 'Imported title',
			description: 'Imported description',
			privacy_setting: 1,
		} );

		// The sideloaded thumbnail became the poster.
		const posterCall = calls.find( call => call.path === POSTER_PATH );
		expect( posterCall?.data ).toEqual( { poster_attachment_id: 55 } );

		// The import was completed server-side (markers moved onto the new
		// video, draft placeholder deleted).
		const completeCall = calls.find( call => call.path === COMPLETE_PATH );
		expect( completeCall?.method ).toBe( 'POST' );
		expect( completeCall?.data ).toEqual( { draft_id: DRAFT_ID, media_id: 77 } );

		// Steps ran in order: metadata → poster → completion.
		expect( calls.indexOf( metaCall! ) ).toBeLessThan( calls.indexOf( posterCall! ) );
		expect( calls.indexOf( posterCall! ) ).toBeLessThan( calls.indexOf( completeCall! ) );

		// Final contract: library and import branches are invalidated.
		await waitFor( () =>
			expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: [ LIBRARY_QUERY_KEY ] } )
		);
		expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: [ IMPORT_QUERY_KEY ] } );
	} );

	it( 'skips the poster step when the draft has no sideloaded thumbnail', async () => {
		const calls = mockAttachApi( {}, { ...DRAFT_IMPORT_META, thumbnail_attachment_id: 0 } );
		const { result } = renderHook( () => useAttachImportMedia(), {
			wrapper: createTestWrapper(),
		} );

		const { attachPromise } = await startAttach( result.current.attach );
		act( () => {
			lastCallbacks.onSuccess?.( UPLOADED_MEDIA );
		} );

		await expect( settleInAct( attachPromise ) ).resolves.toEqual( {
			mediaId: 77,
			guid: 'guid-1',
			posterApplied: false,
		} );
		expect( calls.some( call => call.path === POSTER_PATH ) ).toBe( false );
		// The import is still completed (draft deleted server-side).
		expect( calls.some( call => call.path === COMPLETE_PATH ) ).toBe( true );
	} );
} );

describe( 'useAttachImportMedia — failure paths', () => {
	it( 'rejects with step load_draft when the draft fetch fails, without uploading', async () => {
		mockAttachApi( {
			[ DRAFT_PATH ]: () => {
				throw new Error( 'no such attachment' );
			},
		} );
		const { result } = renderHook( () => useAttachImportMedia(), {
			wrapper: createTestWrapper(),
		} );

		let attachPromise: Promise< unknown > = Promise.resolve();
		act( () => {
			attachPromise = result.current.attach( {
				draftId: DRAFT_ID,
				file: new File( [ 'x' ], 'export.mp4', { type: 'video/mp4' } ),
			} );
		} );

		await expect( settleInAct( attachPromise ) ).resolves.toMatchObject( {
			name: 'AttachImportMediaError',
			step: 'load_draft',
			message: 'no such attachment',
			mediaId: null,
		} );
		expect( mockUploadHandler ).not.toHaveBeenCalled();
	} );

	it( 'rejects with step load_draft when the item is not an awaiting-media draft', async () => {
		mockAttachApi( {}, null );
		const { result } = renderHook( () => useAttachImportMedia(), {
			wrapper: createTestWrapper(),
		} );

		let attachPromise: Promise< unknown > = Promise.resolve();
		act( () => {
			attachPromise = result.current.attach( {
				draftId: DRAFT_ID,
				file: new File( [ 'x' ], 'export.mp4', { type: 'video/mp4' } ),
			} );
		} );

		await expect( settleInAct( attachPromise ) ).resolves.toMatchObject( {
			step: 'load_draft',
			message: 'The selected item is not an import draft awaiting media.',
		} );
		expect( mockUploadHandler ).not.toHaveBeenCalled();
	} );

	it( 'rejects with step upload and the tus message when the upload fails', async () => {
		const calls = mockAttachApi();
		const { result } = renderHook( () => useAttachImportMedia(), {
			wrapper: createTestWrapper(),
		} );
		// Read the shared queue straight from the window store: rendering a
		// second useUpload() here would steal `lastCallbacks` from the attach
		// hook's own uploader instance and deadlock the test.
		const readSharedQueue = () =>
			( window as unknown as Record< string, { queue: { origin?: string }[] } > )
				.__jetpackVideopressUploadStore.queue;

		const { attachPromise } = await startAttach( result.current.attach );

		// While in flight, the queue item is tagged as attach-originated so
		// the library listing knows not to splice it in as a row of its own.
		expect( readSharedQueue() ).toHaveLength( 1 );
		expect( readSharedQueue()[ 0 ].origin ).toBe( 'attach' );

		act( () => {
			lastCallbacks.onError?.( new Error( 'tus exploded' ) );
		} );

		await expect( settleInAct( attachPromise ) ).resolves.toMatchObject( {
			step: 'upload',
			message: 'tus exploded',
			mediaId: null,
			guid: null,
		} );
		// Nothing after the upload ran: no meta, no poster, no completion.
		expect( calls.filter( call => call.path !== DRAFT_PATH ) ).toEqual( [] );
		// The failed item was withdrawn from the shared queue — otherwise the
		// library would splice it in as a failed row whose Retry re-runs a
		// plain upload without the attach orchestration.
		expect( readSharedQueue() ).toHaveLength( 0 );
	} );

	it( 'rejects with step upload when the uploader reports no media details', async () => {
		mockAttachApi();
		const { result } = renderHook( () => useAttachImportMedia(), {
			wrapper: createTestWrapper(),
		} );

		const { attachPromise } = await startAttach( result.current.attach );
		act( () => {
			lastCallbacks.onSuccess?.( undefined );
		} );

		await expect( settleInAct( attachPromise ) ).resolves.toMatchObject( {
			step: 'upload',
			message: 'The upload finished but did not report the new video.',
		} );
	} );

	it( 'rejects with step metadata (carrying the uploaded ids) and keeps the draft', async () => {
		const calls = mockAttachApi( {
			[ META_PATH ]: () => {
				throw new Error( 'meta rejected' );
			},
		} );
		const { result } = renderHook( () => useAttachImportMedia(), {
			wrapper: createTestWrapper(),
		} );

		const { attachPromise } = await startAttach( result.current.attach );
		act( () => {
			lastCallbacks.onSuccess?.( UPLOADED_MEDIA );
		} );

		const caught = await settleInAct( attachPromise );
		expect( caught ).toBeInstanceOf( AttachImportMediaError );
		expect( caught ).toMatchObject( {
			step: 'metadata',
			message: 'meta rejected',
			mediaId: 77,
			guid: 'guid-1',
		} );
		// The draft placeholder survives so the flow can be retried/inspected.
		expect( calls.some( call => call.path === COMPLETE_PATH ) ).toBe( false );
	} );

	it( 'treats a poster failure as non-fatal and still deletes the draft', async () => {
		const calls = mockAttachApi( {
			[ POSTER_PATH ]: () => {
				throw new Error( 'poster rejected' );
			},
		} );
		const { result } = renderHook( () => useAttachImportMedia(), {
			wrapper: createTestWrapper(),
		} );

		const { attachPromise } = await startAttach( result.current.attach );
		act( () => {
			lastCallbacks.onSuccess?.( UPLOADED_MEDIA );
		} );

		await expect( settleInAct( attachPromise ) ).resolves.toEqual( {
			mediaId: 77,
			guid: 'guid-1',
			posterApplied: false,
		} );
		expect( calls.some( call => call.path === COMPLETE_PATH ) ).toBe( true );
	} );

	it( 'rejects with step delete_draft (carrying the uploaded ids) when completion fails', async () => {
		mockAttachApi( {
			[ COMPLETE_PATH ]: () => {
				throw new Error( 'complete rejected' );
			},
		} );
		const { result } = renderHook( () => useAttachImportMedia(), {
			wrapper: createTestWrapper(),
		} );

		const { attachPromise } = await startAttach( result.current.attach );
		act( () => {
			lastCallbacks.onSuccess?.( UPLOADED_MEDIA );
		} );

		await expect( settleInAct( attachPromise ) ).resolves.toMatchObject( {
			step: 'delete_draft',
			mediaId: 77,
			guid: 'guid-1',
		} );
	} );
} );
