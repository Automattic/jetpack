import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { LIBRARY_QUERY_KEY } from './use-library';
import { IMPORT_QUERY_KEY } from './use-youtube-connection';
import { VIDEOS_QUERY_SEGMENT } from './use-youtube-videos';

// Second query-key segment for job-status queries
// ([ IMPORT_QUERY_KEY, JOB_QUERY_SEGMENT, jobId ]).
export const JOB_QUERY_SEGMENT = 'job' as const;

/** Milliseconds between job-status polls while the job is running. */
export const JOB_POLL_INTERVAL_MS = 2000;

const IMPORT_PATH = '/jetpack/v4/videopress/import/youtube';
const STATUS_PATH = '/jetpack/v4/videopress/import/status';

type ApiImportJobItem = {
	external_id?: string;
	status?: string;
	attachment_id?: number | null;
	error?: { code?: string; message?: string } | null;
};

type ApiImportJob = {
	job_id?: string;
	status?: string;
	items?: ApiImportJobItem[];
};

type StartImportResponse = { job_id?: string };

export type ImportJobItemStatus = 'queued' | 'done' | 'failed';
export type ImportJobStatus = 'running' | 'done' | 'failed';

export type ImportJobItem = {
	externalId: string;
	status: ImportJobItemStatus;
	/** The draft placeholder's attachment ID once the item is done. */
	attachmentId: number | null;
	error: { code: string; message: string } | null;
};

export type ImportJob = {
	jobId: string;
	status: ImportJobStatus;
	items: ImportJobItem[];
};

/**
 * Normalize a raw job record to camelCase.
 *
 * @param raw - The raw job from the REST response.
 * @return The normalized ImportJob.
 */
function toImportJob( raw: ApiImportJob ): ImportJob {
	return {
		jobId: raw?.job_id ?? '',
		status: ( raw?.status ?? 'running' ) as ImportJobStatus,
		items: ( raw?.items ?? [] ).map( item => ( {
			externalId: item.external_id ?? '',
			status: ( item.status ?? 'queued' ) as ImportJobItemStatus,
			attachmentId: item.attachment_id ?? null,
			error: item.error ? { code: item.error.code ?? '', message: item.error.message ?? '' } : null,
		} ) ),
	};
}

/**
 * Start a YouTube import and poll its job status until it settles.
 *
 * `startImport( videoIds )` POSTs the selected external IDs; the server
 * responds 202 with a job ID, which arms a status query that re-fetches every
 * 2s while the job reports `running` (the use-video.ts polling idiom). When
 * the job settles, the library (new draft rows) and the uploads listing
 * (already_imported flags) are invalidated once.
 *
 * @return The start mutation, the polled job record, and a reset callback.
 */
export function useImportJob() {
	const client = useQueryClient();
	const [ jobId, setJobId ] = useState< string | null >( null );

	const start = useMutation< string, Error, string[] >( {
		mutationFn: async videoIds => {
			const response = await apiFetch< StartImportResponse >( {
				path: IMPORT_PATH,
				method: 'POST',
				data: { video_ids: videoIds },
			} );
			if ( ! response?.job_id ) {
				throw new Error( 'The import request did not return a job ID.' );
			}
			return response.job_id;
		},
		onSuccess: id => setJobId( id ),
	} );

	const status = useQuery< ImportJob >( {
		queryKey: [ IMPORT_QUERY_KEY, JOB_QUERY_SEGMENT, jobId ],
		enabled: Boolean( jobId ),
		queryFn: async () => {
			const raw = await apiFetch< ApiImportJob >( { path: `${ STATUS_PATH }/${ jobId }` } );
			return toImportJob( raw );
		},
		refetchInterval: q => ( q.state.data?.status === 'running' ? JOB_POLL_INTERVAL_MS : false ),
	} );

	// Invalidate downstream caches exactly once per settled job: the import
	// created draft rows (library) and flipped already_imported flags on the
	// uploads listing. The ref guards against re-firing on unrelated renders.
	const settledJobRef = useRef< string | null >( null );
	const jobStatus = status.data?.status;
	useEffect( () => {
		if ( ! jobId || jobStatus === undefined || jobStatus === 'running' ) {
			return;
		}
		if ( settledJobRef.current === jobId ) {
			return;
		}
		settledJobRef.current = jobId;
		client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
		client.invalidateQueries( { queryKey: [ IMPORT_QUERY_KEY, VIDEOS_QUERY_SEGMENT ] } );
	}, [ client, jobId, jobStatus ] );

	const reset = useCallback( () => setJobId( null ), [] );

	// "Importing" covers the whole window from POST to a terminal job status;
	// a jobId with no data yet counts as running (the first poll is in flight).
	const isImporting =
		start.isPending ||
		( Boolean( jobId ) && ! status.isError && ( jobStatus ?? 'running' ) === 'running' );

	return {
		startImport: start.mutateAsync,
		isStarting: start.isPending,
		startError: start.error,
		jobId,
		job: status.data,
		jobError: status.error,
		isImporting,
		reset,
	};
}
