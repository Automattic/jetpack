/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { Layout } from '../layout';
import Button from 'components/button';
import { imagePath } from 'constants/urls';
import analytics from 'lib/analytics';
import { containsBackupRealtime, getPlanClass } from 'lib/plans/constants';
import { getSiteRawUrl } from 'state/initial-state';
import { getActiveBackupPurchase, hasActiveBackupPurchase, getSitePlan } from 'state/site';

/**
 * Style dependencies
 */
import './style.scss';

const OneClickRestoresComponent = props => {
	const { planClass, siteRawUrl } = props;

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

	const backupsName = containsBackupRealtime( planClass )
		? __( 'Real-time Backups', 'jetpack' )
		: __( 'Daily Backups', 'jetpack' );

	return (
		<Layout
			illustrationPath={ imagePath + '/recommendations/one-click-restores.svg' }
			content={
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
							primary
							href={ getRedirectUrl( 'jetpack-backup-dash-credentials', { site: siteRawUrl } ) }
							onClick={ onCtaClick }
						>
							{ __( 'Enable one-click restores', 'jetpack' ) }
						</Button>
					</div>
				</div>
			}
		/>
	);
};

const OneClickRestores = connect( state => ( {
	siteRawUrl: getSiteRawUrl( state ),
	planClass: hasActiveBackupPurchase( state )
		? getPlanClass( getActiveBackupPurchase( state ).product_slug )
		: getPlanClass( getSitePlan( state ).product_slug ),
} ) )( OneClickRestoresComponent );

export { OneClickRestores };
