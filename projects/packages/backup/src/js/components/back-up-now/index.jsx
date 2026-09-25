import apiFetch from '@wordpress/api-fetch';
import { Button, Tooltip } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useState } from 'react';
import { BACKUP_STATE } from '../../constants';
import useAnalytics from '../../hooks/useAnalytics';
import useBackupsState from '../../hooks/useBackupsState.js';
import { STORE_ID } from '../../store';

export const BackupNowButton = ( { children, tooltipText, tracksEventName, onClick } ) => {
	const { tracks } = useAnalytics();
	const [ buttonContent, setButtonContent ] = useState( children );
	const [ currentTooltip, setCurrentTooltip ] = useState( tooltipText );
	const [ isEnqueuing, setIsEnqueuing ] = useState( false );
	const [ enqueued, setEnqueued ] = useState( false );
	const [ enqueueFailed, setEnqueueFailed ] = useState( false );
	const areBackupsStopped = useSelect( select => select( STORE_ID ).getBackupStoppedFlag() );
	const { backupState, fetchBackupsState } = useBackupsState( enqueued );
	const backupCurrentlyInProgress = backupState === BACKUP_STATE.IN_PROGRESS;
	const disabled = isEnqueuing || enqueued || backupCurrentlyInProgress || areBackupsStopped;
	const onClickHandler = useCallback(
		event => {
			if ( tracksEventName ) {
				tracks.recordEvent( tracksEventName );
			}

			setIsEnqueuing( true );
			setEnqueueFailed( false );

			apiFetch( { method: 'POST', path: `/jetpack/v4/site/backup/enqueue` } ).then(
				() => {
					setIsEnqueuing( false );
					setEnqueued( true );
					fetchBackupsState();
				},
				() => {
					// The route reports an unreachable WordPress.com as an error rather
					// than an empty success, so without this branch the click leaves the
					// button busy for good, with no way to retry short of a page reload.
					setIsEnqueuing( false );
					setEnqueueFailed( true );
				}
			);

			if ( onClick ) {
				onClick( event );
			}
		},
		[ tracksEventName, onClick, tracks, fetchBackupsState ]
	);

	useEffect( () => {
		const statusLabels = {
			QUEUEING: __( 'Queueing backup', 'jetpack-backup-pkg' ),
			QUEUED: __( 'Backup enqueued', 'jetpack-backup-pkg' ),
			IN_PROGRESS: __( 'Backup in progress', 'jetpack-backup-pkg' ),
		};

		const statusTooltipTexts = {
			QUEUING: null,
			QUEUED: __( 'A backup has been queued and will start shortly.', 'jetpack-backup-pkg' ),
			IN_PROGRESS: __( 'A backup is currently in progress.', 'jetpack-backup-pkg' ),
		};

		if ( areBackupsStopped ) {
			setCurrentTooltip(
				__( 'Cannot queue backups due to reaching storage limits.', 'jetpack-backup-pkg' )
			);
		} else if ( backupCurrentlyInProgress ) {
			setCurrentTooltip( statusTooltipTexts.IN_PROGRESS );
			setButtonContent( statusLabels.IN_PROGRESS );
			setEnqueued( false );
		} else if ( isEnqueuing ) {
			setButtonContent( statusLabels.QUEUEING );
			setCurrentTooltip( statusTooltipTexts.QUEUING );
		} else if ( enqueued ) {
			setButtonContent( statusLabels.QUEUED );
			setCurrentTooltip( statusTooltipTexts.QUEUED );
		} else if ( enqueueFailed ) {
			setButtonContent( children );
			setCurrentTooltip(
				__( 'The backup could not be queued. Please try again.', 'jetpack-backup-pkg' )
			);
		} else {
			setButtonContent( children );
			setCurrentTooltip( tooltipText );
		}
	}, [
		backupCurrentlyInProgress,
		tooltipText,
		enqueued,
		children,
		areBackupsStopped,
		isEnqueuing,
		enqueueFailed,
	] );

	const button = (
		<div>
			<Button
				size="compact"
				accessibleWhenDisabled
				disabled={ disabled }
				isBusy={ isEnqueuing || backupCurrentlyInProgress }
				onClick={ onClickHandler }
				variant="primary"
			>
				{ buttonContent }
			</Button>
		</div>
	);

	return <>{ currentTooltip ? <Tooltip text={ currentTooltip }>{ button }</Tooltip> : button }</>;
};

BackupNowButton.propTypes = {
	children: PropTypes.node,
	tooltipText: PropTypes.string,
	tracksEventName: PropTypes.string,
	onClick: PropTypes.func,
};

export default BackupNowButton;
