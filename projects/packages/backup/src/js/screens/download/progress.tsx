/* eslint-disable jsdoc/require-jsdoc */

import { useQuery } from '@tanstack/react-query';
import {
	ProgressBar,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect } from 'react';
import { backupDownloadProgressQuery } from '../../data/query-options';

interface DownloadProgressProps {
	downloadId: number;
	onDownloadComplete: ( downloadUrl: string, fileSizeBytes?: string ) => void;
	onDownloadError: () => void;
}

function DownloadProgress( {
	downloadId,
	onDownloadComplete,
	onDownloadError,
}: DownloadProgressProps ) {
	const { data: downloadProgress, error: downloadQueryError } = useQuery( {
		...backupDownloadProgressQuery( downloadId ),
		enabled: !! downloadId,
		// Poll every 1.5s while the URL is pending. Stop on error or once
		// the URL lands — the parent transitions the state machine and
		// this component unmounts.
		refetchInterval: query => {
			const { data, error } = query.state;
			if ( data?.error || error ) {
				return false;
			}
			if ( ! data?.url ) {
				return 1500;
			}
			return false;
		},
	} );

	useEffect( () => {
		if ( downloadProgress?.url ) {
			onDownloadComplete( downloadProgress.url, downloadProgress.bytes_formatted );
		} else if ( downloadProgress?.error || downloadQueryError ) {
			onDownloadError();
		}
	}, [
		downloadProgress?.url,
		downloadProgress?.bytes_formatted,
		downloadProgress?.error,
		onDownloadComplete,
		onDownloadError,
		downloadQueryError,
	] );

	return (
		<VStack spacing={ 4 } alignment="center">
			<p>{ __( 'Initializing the download process', 'jetpack-backup-pkg' ) }</p>
			<p style={ { color: '#757575', fontSize: 13 } }>
				{ sprintf(
					/* translators: %d is the download completion percentage. */
					__( '%d%% completed', 'jetpack-backup-pkg' ),
					downloadProgress?.progress ?? 0
				) }
			</p>
			<ProgressBar value={ downloadProgress?.progress ?? 0 } />
		</VStack>
	);
}

export default DownloadProgress;
