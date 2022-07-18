import { imagePath, GETTING_STARTED_WITH_JETPACK_BACKUP_VIDEO_URL } from 'constants/urls';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import Button from 'components/button';
import analytics from 'lib/analytics';
import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { getSiteRawUrl } from 'state/initial-state';
import { siteHasFeature } from 'state/site';
import { SidebarCard } from '../sidebar-card';

import './style.scss';

const OneClickRestoresComponent = props => {
	const { hasRealTimeBackups, siteRawUrl } = props;

	useEffect( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_display', {
			type: 'one-click-restores',
		} );
	}, [] );

	const onCtaClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_click', {
			type: 'one_click_restores',
		} );
	}, [] );

	const trackOpenVideo = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_backup_getting_started_video_click', {
			position: 'recommendations/one_click_restores',
		} );
	}, [] );

	/* Avoid ternary as code minification will break translation function. :( */
	let backupsName = __( 'Daily Backups', 'jetpack' );
	if ( hasRealTimeBackups ) {
		backupsName = __( 'Real-time Backups', 'jetpack' );
	}

	return (
		<>
			<SidebarCard illustrationPath={ imagePath + '/recommendations/one-click-restores.svg' }>
				<div className="jp-recommendations-one-click-restores">
					<h2>{ __( 'Enable one-click restores', 'jetpack' ) }</h2>
					<p>
						{ sprintf(
							/* translators: placeholder is the name of a backups plan: Daily Backups or Real-time Backups */
							__(
								'Get the most out of your %s. One-click restores ensure you’ll be able to easily restore your site, if anything goes wrong.',
								'jetpack'
							),
							backupsName
						) }
					</p>
					<p>
						{ __(
							'Enter your server credentials to enable one-click restores included in your plan.',
							'jetpack'
						) }
					</p>
					<div className="jp-recommendations-one-click-restores__cta">
						<Button
							rna
							href={ getRedirectUrl( 'jetpack-backup-dash-credentials', { site: siteRawUrl } ) }
							onClick={ onCtaClick }
						>
							{ __( 'Enable one-click restores', 'jetpack' ) }
						</Button>
					</div>
				</div>
			</SidebarCard>
			<SidebarCard compact>
				<div className="jp-recommendations-getting-started-compact">
					<a
						href={ GETTING_STARTED_WITH_JETPACK_BACKUP_VIDEO_URL }
						onClick={ trackOpenVideo }
						target="_blank"
						rel="noreferrer"
					>
						<img
							className="jp-recommendations-getting-started-compact__thumbnail"
							src={ imagePath + 'backup-getting-started-thumbnail.png' }
							srcSet={ `${ imagePath + 'backup-getting-started-thumbnail.png' } 1x, ${
								imagePath + 'backup-getting-started-thumbnail-2x.png'
							} 2x` }
							alt=""
						/>
					</a>
					<div>
						<h2>{ __( 'Getting started with Jetpack Backup', 'jetpack' ) }</h2>
						<p>{ __( 'A short video guide on how to back up your website', 'jetpack' ) }</p>
					</div>
				</div>
			</SidebarCard>
		</>
	);
};

const OneClickRestores = connect( state => ( {
	hasRealTimeBackups: siteHasFeature( state, 'real-time-backups' ),
	siteRawUrl: getSiteRawUrl( state ),
} ) )( OneClickRestoresComponent );

export { OneClickRestores };
