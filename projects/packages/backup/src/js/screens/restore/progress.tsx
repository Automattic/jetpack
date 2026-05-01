/* eslint-disable jsdoc/require-jsdoc */

import { useQuery } from '@tanstack/react-query';
import {
	ProgressBar,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, _x, sprintf } from '@wordpress/i18n';
import { useEffect } from 'react';
import { backupRestoreProgressQuery } from '../../data/query-options';

interface RestoreProgressProps {
	restoreId: number;
	onRestoreComplete: () => void;
	onRestoreError: ( reason?: string ) => void;
}

function RestoreProgress( { restoreId, onRestoreComplete, onRestoreError }: RestoreProgressProps ) {
	const { data: restoreProgress, error: restoreQueryError } = useQuery( {
		...backupRestoreProgressQuery( restoreId ),
		enabled: !! restoreId,
		// Poll every 2s while the restore is queued or running. Stop on
		// terminal status or transport error — the parent transitions the
		// state machine and this component unmounts.
		refetchInterval: query => {
			const { data, error } = query.state;
			if ( error ) {
				return false;
			}
			if ( data?.status === 'finished' || data?.status === 'fail' ) {
				return false;
			}
			return 2000;
		},
	} );

	useEffect( () => {
		if ( restoreProgress?.status === 'finished' ) {
			onRestoreComplete();
		} else if ( restoreProgress?.status === 'fail' || restoreQueryError ) {
			onRestoreError( restoreProgress?.reason || restoreProgress?.message );
		}
	}, [
		restoreProgress?.status,
		restoreProgress?.reason,
		restoreProgress?.message,
		onRestoreComplete,
		onRestoreError,
		restoreQueryError,
	] );

	// Two distinct call sites — `_x` on one branch defeats Terser's
	// signature-merging that would otherwise fold both `__()`s into a
	// single call with a string-literal ternary.
	const label =
		restoreProgress?.status === 'queued'
			? _x( 'Queued for restore…', '', 'jetpack-backup-pkg' )
			: __( 'Restoring your site…', 'jetpack-backup-pkg' );

	return (
		<VStack spacing={ 4 } alignment="center">
			<p>{ label }</p>
			<p style={ { color: '#757575', fontSize: 13 } }>
				{ sprintf(
					/* translators: %d is the restore completion percentage. */
					__( '%d%% completed', 'jetpack-backup-pkg' ),
					restoreProgress?.progress ?? 0
				) }
			</p>
			<ProgressBar value={ restoreProgress?.progress ?? 0 } />
		</VStack>
	);
}

export default RestoreProgress;
