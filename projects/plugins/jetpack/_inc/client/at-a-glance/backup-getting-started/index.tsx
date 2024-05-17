import { imagePath, GETTING_STARTED_WITH_JETPACK_BACKUP_VIDEO_URL } from 'constants/urls';
import { __ } from '@wordpress/i18n';
import Button from 'components/button';
import Card from 'components/card';
import analytics from 'lib/analytics';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { backupGettingStartedDismissed, updateSettings } from 'state/settings';
import './style.scss';

type Props = { isDismissed: boolean; dismiss: () => void };
const BackupGettingStarted = ( { isDismissed, dismiss }: Props ) => {
	const handleDismiss = useCallback( () => {
		dismiss();
		analytics.tracks.recordEvent( 'jetpack_backup_getting_started_video_dismiss', {
			position: 'at_a_glance',
		} );
	}, [ dismiss ] );

	const trackOpenVideo = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_backup_getting_started_video_click', {
			position: 'at_a_glance',
		} );
	}, [] );

	if ( isDismissed ) {
		return null;
	}

	return (
		<Card className="dash-backup-getting-started">
			<Button
				borderless
				compact
				className="dash-backup-getting-started__dismiss"
				onClick={ handleDismiss }
			>
				<span className="dashicons dashicons-no" />
			</Button>
			<a href={ GETTING_STARTED_WITH_JETPACK_BACKUP_VIDEO_URL } target="_blank" rel="noreferrer">
				<img
					className="dash-backup-getting-started__thumbnail"
					src={ imagePath + 'backup-getting-started-thumbnail.png' }
					srcSet={ `${ imagePath + 'backup-getting-started-thumbnail.png' } 1x, ${
						imagePath + 'backup-getting-started-thumbnail-2x.png'
					} 2x` }
					alt=""
				/>
			</a>
			<div className="dash-backup-getting-started__content">
				<h3 className="dash-backup-getting-started__header">
					{ __( 'Getting started with Jetpack Backup', 'jetpack' ) }
				</h3>
				<p className="dash-backup-getting-started__text">
					{ __( 'A short video guide on how to back up your website', 'jetpack' ) }
				</p>
			</div>
			<Button
				className="dash-backup-getting-started__cta"
				href={ GETTING_STARTED_WITH_JETPACK_BACKUP_VIDEO_URL }
				onClick={ trackOpenVideo }
				target="_blank"
				rel="noreferrer"
				compact
				primary
			>
				{ __( 'Watch the video', 'jetpack' ) }
			</Button>
		</Card>
	);
};

export default connect(
	state => ( {
		isDismissed: backupGettingStartedDismissed( state ),
	} ),
	dispatch => ( {
		dismiss: () => dispatch( updateSettings( { dismiss_dash_backup_getting_started: true } ) ),
	} )
)( BackupGettingStarted );
