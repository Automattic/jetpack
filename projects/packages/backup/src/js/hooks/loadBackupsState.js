import apiFetch from '@wordpress/api-fetch';
import { date } from '@wordpress/date';
import { BACKUP_STATE } from '../constants';

const loadBackupsState = (
	setProgress,
	setBackupState,
	setLatestTime,
	setStats,
	setTrackProgress,
	trackProgress
) => {
	const progressInterval = 1 * 1000; // How often to poll for backup progress updates.

	apiFetch( { path: '/jetpack/v4/backups' } ).then(
		res => {
			// If we have no backups don't load up stats.
			let latestBackup = null;
			if ( res.length === 0 ) {
				setBackupState( BACKUP_STATE.NO_BACKUPS );
			} else if ( res.length === 1 && 'error-will-retry' === res[ 0 ].status ) {
				setBackupState( BACKUP_STATE.NO_BACKUPS_RETRY );
			} else {
				// Check for the first completed backups.
				res.forEach( backup => {
					if ( null !== latestBackup ) {
						return;
					}

					if ( 'finished' === backup.status && backup.stats ) {
						latestBackup = backup;
						setBackupState( BACKUP_STATE.COMPLETE );
					}
				} );

				// Only the first backup can be in progress.
				if ( null === latestBackup && 'started' === res[ 0 ].status ) {
					latestBackup = res[ 0 ];
					setProgress( latestBackup.percent );
					setBackupState( BACKUP_STATE.IN_PROGRESS );
				}

				// No complete or in progress backups.
				if ( ! latestBackup ) {
					setBackupState( BACKUP_STATE.NO_GOOD_BACKUPS );
					return;
				}

				// Setup data for COMPLETE state.
				if ( 'finished' === latestBackup.status ) {
					const postsTable = latestBackup.stats.prefix + 'posts';
					setStats( {
						plugins: latestBackup.stats.plugins.count,
						themes: latestBackup.stats.themes.count,
						uploads: latestBackup.stats.uploads.count,
						posts: latestBackup.stats.tables[ postsTable ].post_published,
						warnings: latestBackup.has_warnings ? true : false,
					} );
					setLatestTime( date( 'c', latestBackup.last_updated + '+00:00' ) );
				}
			}

			// Repeat query for NO_BACKUPS (before first) and IN_PROGRESS
			if ( res.length === 0 || 'started' === latestBackup.status ) {
				// Grab progress and update every progressInterval until complete.
				setTimeout( () => {
					setTrackProgress( trackProgress + 1 );
				}, progressInterval );
			}
		},
		() => {
			setBackupState( BACKUP_STATE.NO_GOOD_BACKUPS );
		}
	);
	// eslint-disable-next-line react-hooks/exhaustive-deps
};

export default loadBackupsState;
