/**
 * External dependencies
 */
import { getDate, date, dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { createInterpolateElement, useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../store';
import StatBlock from './StatBlock';
import './backups-style.scss';
import PostsIcon from './icons/posts.svg';
import CloudIcon from './icons/cloud.svg';
import UploadsIcon from './icons/uploads.svg';
import PluginsIcon from './icons/plugins.svg';
import ThemesIcon from './icons/themes.svg';
import BackupAnim1 from './icons/backup-animation-1.svg';
import BackupAnim2 from './icons/backup-animation-2.svg';
import BackupAnim3 from './icons/backup-animation-3.svg';

/* eslint react/react-in-jsx-scope: 0 */
const Backups = () => {
	// State information
	const [ progress, setProgress ] = useState( 0 );
	const [ trackProgress, setTrackProgress ] = useState( 0 );
	const [ latestTime, setLatestTime ] = useState( '' );
	const [ stats, setStats ] = useState( {
		posts: 0,
		uploads: 0,
		plugins: 0,
		themes: 0,
	} );
	const domain = useSelect( select => select( STORE_ID ).getCalypsoSlug(), [] );

	const BACKUP_STATE = {
		LOADING: 0,
		IN_PROGRESS: 1,
		NO_BACKUPS: 2,
		NO_GOOD_BACKUPS: 3,
		COMPLETE: 4,
	};

	const [ backupState, setBackupState ] = useState( BACKUP_STATE.LOADING );

	const progressInterval = 1 * 1000; // How often to poll for backup progress updates.

	// Loads data on startup and whenever trackProgress updates.
	useEffect( () => {
		apiFetch( { path: '/jetpack/v4/backups' } ).then(
			res => {
				// If we have no backups don't load up stats.
				let latestBackup = null;

				if ( res.length === 0 ) {
					setBackupState( BACKUP_STATE.NO_BACKUPS );
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
	}, [ trackProgress ] );

	const renderInProgressBackup = () => {
		return (
			<div class="jp-row">
				<div class="lg-col-span-5 md-col-span-8 sm-col-span-4">
					<div class="backup__progress">
						<div class="backup__progress-info">
							<p>{ __( 'Backing up Your Groovy Site…', 'jetpack-backup' ) }</p>
							<p class="backup__progress-info-percentage">{ progress }%</p>
						</div>
						<div class="backup__progress-bar">
							<div class="backup__progress-bar-actual" style={ { width: progress + '%' } }></div>
						</div>
					</div>
					<h1>{ __( 'Your first cloud backup will be ready soon', 'jetpack-backup' ) }</h1>
					<p>
						{ __(
							'The first backup usually takes a few minutes, so it will become available soon.',
							'jetpack-backup'
						) }
					</p>
					<p>
						{ createInterpolateElement(
							__(
								'In the meanwhile, you can start getting familiar with your <a>backup management on Jetpack.com</a>.',
								'jetpack-backup'
							),
							{
								a: (
									<a
										href={ getRedirectUrl( 'jetpack-backup', { site: domain } ) }
										target="_blank"
										rel="noreferrer"
									/>
								),
							}
						) }
					</p>
				</div>
				<div class="lg-col-span-1 md-col-span-4 sm-col-span-0"></div>
				<div class="backup__animation lg-col-span-6 md-col-span-2 sm-col-span-2">
					<img className="backup__animation-el-1" src={ BackupAnim1 } alt="" />
					<img className="backup__animation-el-2" src={ BackupAnim2 } alt="" />
					<img className="backup__animation-el-3" src={ BackupAnim3 } alt="" />
				</div>
			</div>
		);
	};

	const formatDateString = dateString => {
		const todayString = __( 'Today', 'jetpack-backup' );
		const todayDate = getDate();
		let backupDate = todayString;
		if ( dateI18n( 'zY', todayDate ) !== dateI18n( 'zY', dateString ) ) {
			backupDate = dateI18n( 'M j', dateString );
		}
		const backupTime = dateI18n( 'g:i A', dateString );

		return backupDate + ', ' + backupTime;
	};

	const renderCompleteBackup = () => {
		return (
			<div className="jp-row">
				<div className="lg-col-span-3 md-col-span-4 sm-col-span-4">
					<div className="backup__latest">
						<img src={ CloudIcon } alt="" />
						<h2>{ __( 'Latest Backup', 'jetpack-backup' ) }</h2>
					</div>
					<h1>{ formatDateString( latestTime ) }</h1>
					<a
						class="button is-full-width"
						href={ getRedirectUrl( 'jetpack-backup', { site: domain } ) }
						target="_blank"
						rel="noreferrer"
					>
						{ __( 'See all your backups', 'jetpack-backup' ) }
					</a>
				</div>
				<div className="lg-col-span-1 md-col-span-4 sm-col-span-0"></div>
				<div className="lg-col-span-2 md-col-span-2 sm-col-span-2">
					<StatBlock
						icon={ PostsIcon }
						label={ __( 'Posts', 'jetpack-backup' ) }
						value={ stats.posts }
					/>
				</div>
				<div className="lg-col-span-2 md-col-span-2 sm-col-span-2">
					<StatBlock
						icon={ UploadsIcon }
						label={ __( 'Uploads', 'jetpack-backup' ) }
						value={ stats.uploads }
					/>
				</div>
				<div className="lg-col-span-2 md-col-span-2 sm-col-span-2">
					<StatBlock
						icon={ PluginsIcon }
						label={ __( 'Plugins', 'jetpack-backup' ) }
						value={ stats.plugins }
					/>
				</div>
				<div className="lg-col-span-2 md-col-span-2 sm-col-span-2">
					<StatBlock
						icon={ ThemesIcon }
						label={ __( 'Themes', 'jetpack-backup' ) }
						value={ stats.themes }
					/>
				</div>
			</div>
		);
	};

	const renderNoGoodBackups = () => {
		return (
			<div class="jp-row">
				<div class="lg-col-span-5 md-col-span-4 sm-col-span-4">
					<h1>{ __( "We're having trouble backing up your site", 'jetpack-backup' ) }</h1>
					<p>
						{ createInterpolateElement(
							__(
								'Check that your Jetpack Connection is healthy with the <a>Jetpack Debugger</a>.',
								'jetpack-backup'
							),
							{
								a: (
									<a
										href={ getRedirectUrl( 'backup-plugin-debug', { site: domain } ) }
										target="_blank"
										rel="noreferrer"
									/>
								),
							}
						) }
					</p>
					<p>
						{ createInterpolateElement(
							__(
								'You can also find more information in your <a>backup management on Jetpack.com</a>.',
								'jetpack-backup'
							),
							{
								a: (
									<a
										href={ getRedirectUrl( 'jetpack-backup', { site: domain } ) }
										target="_blank"
										rel="noreferrer"
									/>
								),
							}
						) }
					</p>
				</div>
				<div class="lg-col-span-1 md-col-span-4 sm-col-span-0"></div>
				<div class="lg-col-span-6 md-col-span-2 sm-col-span-2"></div>
			</div>
		);
	};

	const renderLoading = () => {
		return <div class="jp-row"></div>;
	};

	return (
		<div className="jp-wrap jp-content">
			{ BACKUP_STATE.LOADING === backupState && renderLoading() }
			{ BACKUP_STATE.NO_BACKUPS === backupState && renderInProgressBackup() }
			{ BACKUP_STATE.IN_PROGRESS === backupState && renderInProgressBackup() }
			{ BACKUP_STATE.COMPLETE === backupState && renderCompleteBackup() }
			{ BACKUP_STATE.NO_GOOD_BACKUPS === backupState && renderNoGoodBackups() }
		</div>
	);
};

export default Backups;
