/* eslint-disable jsdoc/require-returns */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { enqueueBackup } from '../../data/fetchers';
import { backupsQuery } from '../../data/query-options';
import type { BackupState } from '../../data/use-backup-state';
import type { FC } from 'react';

interface BackupNowButtonProps {
	backupState: BackupState;
}

/**
 * Primary header action that enqueues a new backup. Disables itself
 * while an enqueue is in flight or a backup is already running.
 *
 * @param props             - Component props.
 * @param props.backupState - Lifecycle state from `useBackupState`.
 */
const BackupNowButton: FC< BackupNowButtonProps > = ( { backupState } ) => {
	const queryClient = useQueryClient();
	const { status, setEnqueued } = backupState;
	const isRunning = status === 'running';
	const isEnqueued = status === 'enqueued';

	const { mutate: triggerBackup, isPending } = useMutation( {
		mutationFn: enqueueBackup,
		onMutate: () => {
			setEnqueued( true );
		},
		onSuccess: () => {
			queryClient.invalidateQueries( backupsQuery() );
		},
	} );

	const handleClick = useCallback( () => {
		triggerBackup();
	}, [ triggerBackup ] );

	const isDisabled = isRunning || isPending || isEnqueued;

	return (
		<Button
			variant="primary"
			onClick={ handleClick }
			disabled={ isDisabled }
			accessibleWhenDisabled
		>
			{ __( 'Back up now', 'jetpack-backup-pkg' ) }
		</Button>
	);
};

export default BackupNowButton;
