/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { Layout } from '../layout';
import Button from 'components/button';
import ExternalLink from 'components/external-link';
import { imagePath } from 'constants/urls';
import getRedirectUrl from 'lib/jp-redirect';
import { containsBackupRealtime, getPlanClass } from 'lib/plans/constants';
import { getSiteRawUrl } from 'state/initial-state';
import { getActiveBackupPurchase, hasActiveBackupPurchase, getSitePlan } from 'state/site';

/**
 * Style dependencies
 */
import './style.scss';

const OneClickRestoresComponent = props => {
	const { planClass, siteRawUrl } = props;

	const backupsName = containsBackupRealtime( planClass )
		? __( 'Real-time Backups' )
		: __( 'Daily Backups' );

	return (
		<Layout
			illustrationPath={ imagePath + '/recommendations/one-click-restores.svg' }
			content={
				<div className="jp-recommendations-one-click-restores">
					<h2>{ __( 'Enable one-click restores' ) }</h2>
					<p>
						{ sprintf(
							/* translators: placeholder is the name of a backups plan: Daily Backups or Real-time Backups */
							__(
								'Get the most out of your %s. One-click restores ensure we’ll be able to easily restore your site, if anything goes wrong.'
							),
							backupsName
						) }
					</p>
					<p>
						{ __(
							'Enter your server credentials to enable one-click restores included in your plan.'
						) }
					</p>
					<div className="jp-recommendations-one-click-restores__cta">
						<Button
							primary
							href={ getRedirectUrl( 'jetpack-backup-dash-credentials', { site: siteRawUrl } ) }
						>
							{ __( 'Enable one-click restores' ) }
						</Button>
						<ExternalLink
							href="https://jetpack.com/support/ssh-sftp-and-ftp-credentials/"
							target="_blank"
							rel="noopener noreferrer"
							icon={ true }
						>
							{ __( 'Find your server credentials' ) }
						</ExternalLink>
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
