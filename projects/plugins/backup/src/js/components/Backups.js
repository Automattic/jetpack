/**
 * External dependencies
 */
import React, { useState, useEffect } from 'react';
import { getDate, date, dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import StatBlock from './StatBlock';
import './backups-style.scss';
import PostsIcon from './posts.svg';
import CloudIcon from './cloud.svg';
import UploadsIcon from './uploads.svg';
import PluginsIcon from './plugins.svg';
import ThemesIcon from './themes.svg';

const Backups = () => {
	// State information
	const [ progress, setProgress ] = useState( null );
	const [ trackProgress, setTrackProgress ] = useState( 0 );
	const [ latestTime, setLatestTime ] = useState( '' );
	const [ stats, setStats ] = useState( {
		posts: 0,
		uploads: 0,
		plugins: 0,
		themes: 0,
	} );
	const [ domain, setDomain ] = useState( '' );

	const BACKUP_STATE = {
		LOADING: 0,
		IN_PROGRESS: 1,
		NO_BACKUPS: 2,
		COMPLETE: 3,
	};

	const [ backupState, setBackupState ] = useState( BACKUP_STATE.LOADING );

	const progressInterval = 1 * 1000; // How often to poll for backup progress updates.

	// One time loading
	useEffect( () => {
		setDomain( window.location.hostname );
	}, [] );

	// Loads data on startup and whenever trackProgress updates.
	useEffect( () => {
		apiFetch( { path: '/jetpack/v4/backups' } ).then(
			res => {
				// If we have no backups don't load up stats.
				if ( res.length === 0 ) {
					return;
				}

				let latestBackup = null;

				// Check for the first completed backups.
				res.forEach( backup => {
					if ( null !== latestBackup ) {
						return;
					}

					if ( 'finished' === backup.status ) {
						latestBackup = backup;
						setBackupState( BACKUP_STATE.COMPLETE );
					}
				} );

				// Only the first backup can be in progress.
				if ( 'started' === res[ 0 ].status ) {
					latestBackup = res[ 0 ];
					setBackupState( BACKUP_STATE.IN_PROGRESS );
				}

				// No complete or in progress backups.
				if ( ! latestBackup ) {
					setBackupState( BACKUP_STATE.NO_BACKUPS );
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

				// Setup data for IN_PROGRESS.
				if ( 'started' === latestBackup.status ) {
					// Grab progress and update every progressInterval until complete.
					setProgress( latestBackup.percent );
					setTimeout( () => {
						setTrackProgress( trackProgress + 1 );
					}, progressInterval );
				}
			},
			() => {
				setBackupState( BACKUP_STATE.NO_BACKUPS );
			}
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ trackProgress ] );

	const renderInProgressBackup = () => {
		return (
			<div class="jp-row">
				<div class="lg-col-span-5 md-col-span-4 sm-col-span-4">
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
						{ __(
							'In the meanwhile, you can start getting familiar with your ',
							'jetpack-backup'
						) }
						<a href={ 'https://cloud.jetpack.com/backup/' + domain }>
							{ __( 'backup management on Jetpack.com', 'jetpack-backup' ) }
						</a>
						.
					</p>
				</div>
				<div class="lg-col-span-1 md-col-span-4 sm-col-span-0"></div>
				<div class="backup__animation lg-col-span-6 md-col-span-2 sm-col-span-2">
					<svg
						class="backup__animation-el-1"
						width="176"
						height="212"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<g filter="url(#filter1_d)">
							<rect x="40" y="40" width="96" height="132" rx="3" fill="#98C6D9"></rect>
						</g>
						<defs>
							<filter
								id="filter1_d"
								x="0"
								y="0"
								width="176"
								height="212"
								filterUnits="userSpaceOnUse"
								color-interpolation-filters="sRGB"
							>
								<feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood>
								<feColorMatrix
									in="SourceAlpha"
									values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
								></feColorMatrix>
								<feOffset></feOffset>
								<feGaussianBlur stdDeviation="20"></feGaussianBlur>
								<feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"></feColorMatrix>
								<feBlend in2="BackgroundImageFix" result="effect1_dropShadow"></feBlend>
								<feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape"></feBlend>
							</filter>
						</defs>
					</svg>

					<svg
						class="backup__animation-el-2"
						width="248"
						height="200"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<g filter="url(#filter2_d)">
							<rect x="40" y="40" width="168" height="120" rx="3" fill="#F2D76B"></rect>
						</g>
						<defs>
							<filter
								id="filter2_d"
								x="0"
								y="0"
								width="248"
								height="200"
								filterUnits="userSpaceOnUse"
								color-interpolation-filters="sRGB"
							>
								<feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood>
								<feColorMatrix
									in="SourceAlpha"
									values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
								></feColorMatrix>
								<feOffset></feOffset>
								<feGaussianBlur stdDeviation="20"></feGaussianBlur>
								<feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"></feColorMatrix>
								<feBlend in2="BackgroundImageFix" result="effect2_dropShadow"></feBlend>
								<feBlend in="SourceGraphic" in2="effect2_dropShadow" result="shape"></feBlend>
							</filter>
						</defs>
					</svg>

					<svg
						class="backup__animation-el-3"
						width="536"
						height="196"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<g filter="url(#filter3_d)">
							<rect x="40" y="40" width="456" height="116" rx="8" fill="#fff"></rect>
						</g>
						<path
							d="M475.35 62.04A7.49 7.49 0 00468 56c-2.89 0-5.4 1.64-6.65 4.04A5.994 5.994 0 00456 66c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
							fill="#E9EFF5"
						></path>
						<circle cx="100" cy="98" r="36" fill="#F7A8C3"></circle>
						<path
							d="M160 84a6 6 0 016-6h174a6 6 0 110 12H166a6 6 0 01-6-6zM160 112a6 6 0 016-6h276a6 6 0 110 12H166a6 6 0 01-6-6z"
							fill="#E9EFF5"
						></path>
						<defs>
							<filter
								id="filter3_d"
								x="0"
								y="0"
								width="536"
								height="196"
								filterUnits="userSpaceOnUse"
								color-interpolation-filters="sRGB"
							>
								<feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood>
								<feColorMatrix
									in="SourceAlpha"
									values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
								></feColorMatrix>
								<feOffset></feOffset>
								<feGaussianBlur stdDeviation="20"></feGaussianBlur>
								<feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"></feColorMatrix>
								<feBlend in2="BackgroundImageFix" result="effect3_dropShadow"></feBlend>
								<feBlend in="SourceGraphic" in2="effect3_dropShadow" result="shape"></feBlend>
							</filter>
						</defs>
					</svg>
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
						href={ 'https://cloud.jetpack.com/backup/' + domain }
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

	const renderNoBackups = () => {
		return (
			<div class="jp-row">
				<div class="lg-col-span-5 md-col-span-4 sm-col-span-4">
					<h1>{ __( "We're having trouble backing up your site", 'jetpack-backup' ) }</h1>
					<p>
						{ __( 'Check that your Jetpack Connection is healthy with the ', 'jepack-backup' ) }
						<a
							href={ 'https://tools.jetpack.com/debug/?url=' + domain }
							target="_blank"
							rel="noreferrer"
						>
							{ __( 'Jetpack Debugger', 'jetpack-backup' ) }
						</a>
						.
					</p>
					<p>
						{ __( 'You can also find more information in your ', 'jetpack-backup' ) }
						<a href={ 'https://cloud.jetpack.com/backup/' + domain }>
							{ __( 'backup management on Jetpack.com', 'jetpack-backup' ) }
						</a>
						.
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
		<div className="jp-wrap">
			{ BACKUP_STATE.LOADING === backupState && renderLoading() }
			{ BACKUP_STATE.IN_PROGRESS === backupState && renderInProgressBackup() }
			{ BACKUP_STATE.COMPLETE === backupState && renderCompleteBackup() }
			{ BACKUP_STATE.NO_BACKUPS === backupState && renderNoBackups() }
		</div>
	);
};

export default Backups;
