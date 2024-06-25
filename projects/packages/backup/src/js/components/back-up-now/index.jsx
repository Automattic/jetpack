import { Button } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { Tooltip } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useState } from 'react';
import { BACKUP_STATE } from '../../constants';
import useAnalytics from '../../hooks/useAnalytics';
import useBackupsState from '../../hooks/useBackupsState.js';
import { STORE_ID } from '../../store';

export const BackupNowButton = ( {
	children,
	tooltipText,
	tracksEventName,
	variant = 'primary',
	weight = 'regular',
	onClick,
} ) => {
	const { tracks } = useAnalytics();
	const [ buttonContent, setButtonContent ] = useState( children );
	const [ currentTooltip, setCurrentTooltip ] = useState( tooltipText );
	const [ isEnqueuing, setIsEnqueuing ] = useState( false );
	const [ enqueued, setEnqueued ] = useState( false );
	const areBackupsStopped = useSelect( select => select( STORE_ID ).getBackupStoppedFlag() );
	const { backupState, fetchBackupsState } = useBackupsState();
	const backupCurrentlyInProgress = backupState === BACKUP_STATE.IN_PROGRESS;
	const disabled = isEnqueuing || enqueued || backupCurrentlyInProgress || areBackupsStopped;
	const onClickHandler = useCallback(
		event => {
			if ( tracksEventName ) {
				tracks.recordEvent( tracksEventName );
			}

			setIsEnqueuing( true );

			apiFetch( { method: 'POST', path: `/jetpack/v4/site/backup/enqueue` } ).then( () => {
				setIsEnqueuing( false );
				setEnqueued( true );
				fetchBackupsState();
			} );

			if ( onClick ) {
				onClick( event );
			}
		},
		[ tracksEventName, onClick, tracks, fetchBackupsState ]
	);

	useEffect( () => {
		const statusLabels = {
			QUEUEING: 'Queueing backup',
			QUEUED: 'Backup enqueued',
			IN_PROGRESS: 'Backup in progress',
		};

		const statusTooltipTexts = {
			QUEUING: null,
			QUEUED: 'A backup has been queued and will start shortly.',
			IN_PROGRESS: 'A backup is currently in progress.',
		};

		if ( areBackupsStopped ) {
			setCurrentTooltip( 'Cannot queue backups due to reaching storage limits.' );
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
	] );

	const button = (
		<div>
			<Button
				variant={ variant }
				onClick={ onClickHandler }
				disabled={ disabled }
				isBusy={ isEnqueuing || backupCurrentlyInProgress }
				weight={ weight }
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
	variant: PropTypes.oneOf( [ 'primary', 'secondary', 'tertiary' ] ),
	weight: PropTypes.oneOf( [ 'regular', 'bold' ] ),
	onClick: PropTypes.func,
};

export default BackupNowButton;
