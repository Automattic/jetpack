import { useDispatch, useSelect } from '@wordpress/data';
import { date } from '@wordpress/date';
import { useCallback, useState, useEffect, useRef } from '@wordpress/element';
import { BACKUP_STATE } from '../constants';
import { STORE_ID } from '../store';

const useBackupsState = ( shouldPoll = false ) => {
	const progressInterval = 1 * 1000; // How often to poll for backup progress updates.
	const [ backupState, setBackupState ] = useState( BACKUP_STATE.LOADING );
	const [ latestTime, setLatestTime ] = useState( '' );
	const [ progress, setProgress ] = useState( 0 );
	const [ isInitialBackup, setIsInitialBackup ] = useState( false );
	const [ stats, setStats ] = useState( {
		posts: 0,
		uploads: 0,
		plugins: 0,
		themes: 0,
		warnings: false,
	} );

	const dispatch = useDispatch( STORE_ID );
	const backups = useSelect( select => select( STORE_ID ).getBackups() );
	const isFetching = useSelect( select => select( STORE_ID ).isFetchingBackups() );
	const hasLoaded = useSelect( select => select( STORE_ID ).hasLoadedBackups() );
	const fetchFailed = useSelect( select => select( STORE_ID ).hasBackupsFetchFailed() );
	const fetchBackupsState = useCallback( () => {
		if ( ! isFetching ) {
			dispatch.getBackups();
		}
	}, [ dispatch, isFetching ] );

	// Ref for interval ID of fetching backups
	const fetchIntervalRef = useRef( null );

	// Clears refetching interval. Used when backup completes or component unmounts.
	const clearFetchInterval = useCallback( () => {
		if ( fetchIntervalRef.current ) {
			clearInterval( fetchIntervalRef.current );
			fetchIntervalRef.current = null; // Reset ref after clearing.
		}
	}, [] );

	useEffect( () => {
		if ( isFetching ) {
			return;
		}

		let latestBackup = null;

		// Nothing loaded and the last read failed. Worth its own state: an
		// empty list means "this site has no backups yet", and a failed read
		// means we do not know — but both arrive here as an empty `backups`,
		// which is why a WordPress.com blip used to show a paying customer
		// the first-run screen.
		const readFailed = hasLoaded && fetchFailed && backups.length === 0;

		// If we have no backups don't load up stats.
		if ( hasLoaded ) {
			if ( readFailed ) {
				setBackupState( BACKUP_STATE.FETCH_FAILED );
			} else if ( backups.length === 0 ) {
				setBackupState( BACKUP_STATE.NO_BACKUPS );
			} else if ( backups.length === 1 && 'error-will-retry' === backups[ 0 ].status ) {
				setBackupState( BACKUP_STATE.NO_BACKUPS_RETRY );
			} else {
				// Check for the first completed backups.
				backups.forEach( backup => {
					if ( null !== latestBackup ) {
						return;
					}

					if ( 'finished' === backup.status && backup.stats && '0' === backup.discarded ) {
						latestBackup = backup;
						setBackupState( BACKUP_STATE.COMPLETE );
					}
				} );

				// Only the first backup can be in progress.
				if ( 'started' === backups[ 0 ].status ) {
					if ( null === latestBackup ) {
						setIsInitialBackup( true );
					}

					latestBackup = backups[ 0 ];
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
		}

		// Repeat query for NO_BACKUPS (before first) and IN_PROGRESS.
		//
		// A failed read is deliberately excluded. This fires once a second,
		// and an empty list is one of its trigger conditions, so retrying
		// through an outage would put a signed WordPress.com request on the
		// wire every second for as long as the tab stays open — filling the
		// site's own error log on the way. The modernized dashboard already
		// settled this the same way (`pollInterval()` in
		// `dashboard/hooks/use-backups.ts` returns false and "waits to be
		// asked"), which is what the error state's Try again button is for.
		// Note this only stops the poll when nothing is loaded: a tick that
		// fails against an in-progress backup still has a list on screen to
		// keep refreshing.
		if (
			! readFailed &&
			( shouldPoll ||
				backups.length === 0 ||
				( latestBackup && 'started' === latestBackup.status ) )
		) {
			fetchIntervalRef.current = setInterval( fetchBackupsState, progressInterval );
		} else {
			clearFetchInterval();
		}

		// Ensures interval cleanup on component unmount or before effect reruns.
		return () => clearFetchInterval();
	}, [
		backups,
		clearFetchInterval,
		fetchBackupsState,
		fetchFailed,
		hasLoaded,
		isFetching,
		progressInterval,
		shouldPoll,
	] );

	return {
		backups,
		backupState,
		fetchBackupsState,
		isInitialBackup,
		latestTime,
		progress,
		stats,
	};
};

export default useBackupsState;
