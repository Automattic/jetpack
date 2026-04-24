/* eslint-disable jsdoc/require-description, jsdoc/require-param-description, jsdoc/require-returns */

import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useState } from '@wordpress/element';
import { prepareBackupDownload } from '../../../data/fetchers';
import { backupFilteredDownloadStatusQuery } from '../../../data/query-options';

// Three-state FSM mirroring Calypso's `constants.ts`. Exposed so the
// caller can tell the difference between "not clicked yet", "building",
// and "ready to hand the URL to the browser".
export const PREPARE_DOWNLOAD_STATUS = {
	NOT_STARTED: 'NOT_STARTED',
	PREPARING: 'PREPARING',
	READY: 'READY',
} as const;

export type PrepareDownloadStatus =
	( typeof PREPARE_DOWNLOAD_STATUS )[ keyof typeof PREPARE_DOWNLOAD_STATUS ];

/**
 *
 * @param onError
 */
export function usePrepareDownload( onError: () => void ) {
	const [ status, setStatus ] = useState< PrepareDownloadStatus >(
		PREPARE_DOWNLOAD_STATUS.NOT_STARTED
	);
	const [ buildKey, setBuildKey ] = useState< string | null >( null );
	const [ dataType, setDataType ] = useState< number | null >( null );
	const [ downloadUrl, setDownloadUrl ] = useState< string | undefined >();

	const { mutate: prepareMutate } = useMutation( {
		mutationFn: ( payload: { rewindId: string; manifestFilter: string; dataType: number } ) =>
			prepareBackupDownload( payload ),
	} );

	// Poll the build status every 5s once we have a key. `url` populated
	// means the filtered archive is ready to download; anything else keeps
	// us polling until the user cancels or the request errors.
	useQuery( {
		...backupFilteredDownloadStatusQuery( buildKey ?? '', dataType ?? 0 ),
		enabled: !! buildKey && !! dataType && status === PREPARE_DOWNLOAD_STATUS.PREPARING,
		refetchInterval: query => {
			const data = query.state.data;
			if ( data?.status === 'ready' && data.url ) {
				return false;
			}
			return 5000;
		},
		select: data => {
			if ( data?.status === 'ready' && data.url ) {
				setStatus( PREPARE_DOWNLOAD_STATUS.READY );
				setDownloadUrl( data.url );
			}
			return data;
		},
	} );

	const prepareDownload = useCallback(
		( rewindId: string, manifestFilter: string, payloadDataType: number ) => {
			setStatus( PREPARE_DOWNLOAD_STATUS.PREPARING );
			setDownloadUrl( undefined );
			prepareMutate(
				{ rewindId, manifestFilter, dataType: payloadDataType },
				{
					onSuccess: response => {
						if ( ! response.ok || ! response.key ) {
							setStatus( PREPARE_DOWNLOAD_STATUS.NOT_STARTED );
							onError();
							return;
						}
						setBuildKey( response.key );
						setDataType( payloadDataType );
					},
					onError: () => {
						setStatus( PREPARE_DOWNLOAD_STATUS.NOT_STARTED );
						onError();
					},
				}
			);
		},
		[ prepareMutate, onError ]
	);

	return { prepareDownload, prepareDownloadStatus: status, downloadUrl };
}
