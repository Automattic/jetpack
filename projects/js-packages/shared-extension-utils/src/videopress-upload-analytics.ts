import jetpackAnalytics from '@automattic/jetpack-analytics';

export type UploadSource = 'dashboard' | 'block_editor' | 'analytics_widget';
export type UploadContext = { isFree?: boolean | null; videoCountBefore?: number };
type Properties = Record< string, string | number | boolean >;
type FailureStage = 'token' | 'transfer' | 'resume_lookup';
type ReadinessSource = 'media_rest' | 'video_api';
type PendingReadiness = {
	guid: string;
	observed: ( source: ReadinessSource ) => void;
	expiresAt: number;
};

// Route bundles have separate module instances; correlation lasts only within this page.
const getPendingReadiness = () => {
	const page = globalThis as typeof globalThis & {
		__jetpackVideopressPendingReadiness?: Map< string, PendingReadiness >;
	};
	const pending = ( page.__jetpackVideopressPendingReadiness ??= new Map() );
	for ( const [ uploadId, entry ] of pending ) {
		if ( performance.now() >= entry.expiresAt ) {
			pending.delete( uploadId );
		}
	}
	return pending;
};

/**
 * Observe a ready rendition in an existing metadata response, without starting requests.
 *
 * @param guid     - Response video GUID.
 * @param ready    - Positive rendition readiness, never a thumbnail or overall finished flag.
 * @param source   - Metadata endpoint that supplied the observation.
 */
export function observeVideoPlayability( guid: unknown, ready: unknown, source: ReadinessSource ) {
	if ( typeof guid !== 'string' || ready !== true ) {
		return;
	}
	const pending = getPendingReadiness();
	for ( const [ uploadId, entry ] of pending ) {
		if ( entry.guid === guid ) {
			pending.delete( uploadId );
			entry.observed( source );
		}
	}
}

/**
 * Check for a completed MP4 rendition in the public video metadata response.
 *
 * @param video - Video API response.
 * @return Whether a completed rendition has a nonempty MP4 path.
 */
export function hasReadyVideoRendition( video: {
	files?: Record< string, { mp4?: string } | null >;
	files_status?: Record< string, { mp4?: string } | null >;
} ) {
	return Object.entries( video.files ?? {} ).some(
		( [ format, file ] ) =>
			typeof file?.mp4 === 'string' &&
			file.mp4.length > 0 &&
			video.files_status?.[ format ]?.mp4 === 'DONE'
	);
}

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
	let fileType = file.type ? 'other' : 'unknown';
	if ( FILE_TYPES.has( file.type ) ) {
		fileType = file.type;
	}
	const selectedContext: Properties = {
		...( typeof context.isFree === 'boolean' ? { is_free: context.isFree } : {} ),
		...( typeof context.videoCountBefore === 'number' &&
		Number.isSafeInteger( context.videoCountBefore ) &&
		context.videoCountBefore >= 0
			? { video_count_before: context.videoCountBefore }
			: {} ),
	};

	const record = ( event: string, properties: Properties = {}, prefix = 'upload' ) => {
		if ( ! uploadId ) {
			return;
		}
		try {
			jetpackAnalytics.tracks.recordEvent( `jetpack_videopress_${ prefix }_${ event }`, {
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
				file_type: fileType,
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
			const succeededAt = performance.now();
			record( 'succeeded', {
				duration_ms: Math.max( 0, Math.round( succeededAt - startedAt ) ),
				guid_valid: validGuid,
				...( validGuid ? { guid } : {} ),
			} );
			if ( validGuid && uploadId ) {
				const pending = getPendingReadiness();
				if ( ! pending.has( uploadId ) ) {
					// Bound page-local retention, including uploads that never receive a ready response.
					if ( pending.size >= 500 ) {
						const oldest = pending.keys().next().value;
						if ( oldest !== undefined ) {
							pending.delete( oldest );
						}
					}
					pending.set( uploadId, {
						guid,
						expiresAt: succeededAt + 24 * 60 * 60 * 1000,
						observed: observationSource => {
							const observedAt = performance.now();
							record(
								'playable',
								{
									guid,
									seconds_since_upload: Math.max( 0, observedAt - succeededAt ) / 1000,
									seconds_since_upload_started: Math.max( 0, observedAt - startedAt ) / 1000,
									clock_basis: 'upload_success_callback',
									readiness_basis: 'server_reported_mp4',
									observation_source: observationSource,
								},
								'video'
							);
						},
					} );
				}
			}
		},
		fail( error: unknown, stage: FailureStage ) {
			if ( state !== 'active' && ! ( state === 'paused' && stage === 'resume_lookup' ) ) {
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
