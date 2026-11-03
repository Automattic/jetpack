import jetpackAnalytics from '@automattic/jetpack-analytics';

export type UploadSource = 'dashboard' | 'block_editor' | 'analytics_widget';
export type UploadContext = { isFree?: boolean | null; videoCountBefore?: number };
type Properties = Record< string, string | number | boolean >;
type FailureStage = 'token' | 'transfer' | 'resume_lookup';

const FILE_TYPES = new Set( [
	'video/mp4',
	'video/quicktime',
	'video/webm',
	'video/ogg',
	'video/x-msvideo',
	'video/x-ms-wmv',
	'video/mpeg',
	'video/3gpp',
	'video/3gpp2',
] );

/**
 * Observe a browser upload without changing transport or exposing file content.
 *
 * @param file    - Selected file; only size and an allowlisted MIME type are recorded.
 * @param source  - Entry surface.
 * @param context - Known client-side eligibility/count context at selection.
 * @return Lifecycle recorder, retained across explicit retries of this selection.
 */
export function createUploadAnalytics(
	file: File,
	source: UploadSource,
	context: UploadContext = {}
) {
	let uploadId: string | undefined;
	try {
		uploadId = Array.from( globalThis.crypto.getRandomValues( new Uint32Array( 4 ) ), value =>
			value.toString( 16 ).padStart( 8, '0' )
		).join( '' );
	} catch {
		// Missing secure randomness suppresses analytics, never the upload.
	}
	let state: 'idle' | 'active' | 'paused' | 'failed' | 'succeeded' = 'idle';
	let attempt = 0;
	let sequence = 0;
	let startedAt = 0;
	let bytesUploaded = 0;
	let retryCount = 0;
	let pendingNetworkRetry = false;
	const fileSize = Number.isSafeInteger( file.size ) && file.size >= 0 ? file.size : undefined;
	const selectedContext: Properties = {
		...( typeof context.isFree === 'boolean' ? { is_free: context.isFree } : {} ),
		...( typeof context.videoCountBefore === 'number' &&
		Number.isSafeInteger( context.videoCountBefore ) &&
		context.videoCountBefore >= 0
			? { video_count_before: context.videoCountBefore }
			: {} ),
	};

	const record = ( event: string, properties: Properties = {} ) => {
		if ( ! uploadId ) {
			return;
		}
		try {
			jetpackAnalytics.tracks.recordEvent( `jetpack_videopress_upload_${ event }`, {
				schema_version: 1,
				upload_id: uploadId,
				attempt,
				sequence: ++sequence,
				source,
				...( fileSize === undefined ? {} : { file_size_bytes: fileSize } ),
				...properties,
			} );
		} catch {
			// A tracking failure must not interrupt the upload's callbacks.
		}
	};

	return {
		isComplete: () => state === 'succeeded',
		start() {
			if ( state === 'active' || state === 'succeeded' ) {
				return;
			}
			if ( state === 'paused' ) {
				state = 'active';
				record( 'retried', { retry_type: 'resume', retry_count: ++retryCount } );
				return;
			}
			const isRetry = state === 'failed';
			state = 'active';
			attempt++;
			startedAt = performance.now();
			bytesUploaded = 0;
			retryCount = 0;
			if ( isRetry ) {
				record( 'retried', { retry_type: 'user', retry_count: 0 } );
			}
			record( 'started', {
				file_type: FILE_TYPES.has( file.type ) ? file.type : file.type ? 'other' : 'unknown',
				...selectedContext,
			} );
		},
		progress( sent: number ) {
			if ( state === 'active' && Number.isFinite( sent ) && sent >= 0 ) {
				bytesUploaded = Math.max( bytesUploaded, Math.min( sent, fileSize ?? sent ) );
			}
		},
		retryScheduled() {
			pendingNetworkRetry = state === 'active';
		},
		requestStarted() {
			if ( state === 'active' && pendingNetworkRetry ) {
				pendingNetworkRetry = false;
				record( 'retried', { retry_type: 'network', retry_count: ++retryCount } );
			}
		},
		resumedExisting() {
			if ( state === 'active' ) {
				record( 'retried', { retry_type: 'stored_upload', retry_count: ++retryCount } );
			}
		},
		pause() {
			if ( state !== 'active' ) {
				return;
			}
			state = 'paused';
			pendingNetworkRetry = false;
			record( 'canceled', {
				action: 'pause',
				...( fileSize !== undefined && fileSize > 0
					? { progress_pct: ( 100 * bytesUploaded ) / fileSize }
					: {} ),
			} );
		},
		succeed( guid: unknown ) {
			if ( state !== 'active' ) {
				return;
			}
			state = 'succeeded';
			const validGuid = typeof guid === 'string' && /^[a-zA-Z0-9]{8}$/.test( guid );
			record( 'succeeded', {
				duration_ms: Math.max( 0, Math.round( performance.now() - startedAt ) ),
				guid_valid: validGuid,
				...( validGuid ? { guid } : {} ),
			} );
		},
		fail( error: unknown, stage: FailureStage ) {
			if ( state !== 'active' ) {
				return;
			}
			state = 'failed';
			const response = ( error as { originalResponse?: { getStatus?: () => number } } )
				?.originalResponse;
			let httpStatus: number | undefined;
			try {
				httpStatus = response?.getStatus?.();
			} catch {
				// An unreadable response remains an unknown status.
			}
			record( 'failed', {
				error_code: `${ stage }_failed`,
				bytes_uploaded: bytesUploaded,
				...( typeof httpStatus === 'number' &&
				Number.isInteger( httpStatus ) &&
				httpStatus >= 100 &&
				httpStatus <= 599
					? { http_status: httpStatus }
					: {} ),
			} );
		},
		metadata() {
			return { source, ...( uploadId ? { upload_id: uploadId } : {} ) };
		},
	};
}

export type UploadAnalytics = ReturnType< typeof createUploadAnalytics >;
