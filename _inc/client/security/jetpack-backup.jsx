/**
 * External dependencies
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { translate as __ } from 'i18n-calypso';
import { get } from 'lodash';
import getRedirectUrl from 'lib/jp-redirect';

/**
 * Internal dependencies
 */
import Banner from 'components/banner';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { FEATURE_SITE_BACKUPS_JETPACK } from 'lib/plans/constants';

export class JetpackBackup extends Component {
	static propTypes = {
		siteRawUrl: PropTypes.string,
		rewindState: PropTypes.string,
	};

	static defaultProps = {
		siteRawUrl: '',
		rewindState: '',
	};

	getVaultPressContent = () => {
		return (
			<SettingsGroup
				module={ { module: 'backups' } }
				support={ {
					text: __(
						'Backs up your site to the global WordPress.com servers, ' +
							'allowing you to restore your content in the event of an emergency or error.'
					),
					link: getRedirectUrl( 'jetpack-support-backup' ),
				} }
			>
				{ __( 'Your site is backed up.' ) }
			</SettingsGroup>
		);
	};

	getRewindMessage() {
		const { siteRawUrl, rewindStatus } = this.props;
		const rewindState = get( rewindStatus, 'state', false );

		switch ( rewindState ) {
			case 'provisioning':
				return {
					title: __( 'Provisioning' ),
					icon: 'info',
					description: __( 'Jetpack Backup is being configured for your site.' ),
					url: '',
				};
			case 'awaiting_credentials':
				return {
					title: __( 'Awaiting credentials' ),
					icon: 'notice',
					description: __(
						'You need to enter your server credentials to finish configuring Jetpack Backup.'
					),
					url: getRedirectUrl( 'calypso-settings-security', { site: siteRawUrl } ),
				};
			case 'active':
				return {
					title: __( 'Active' ),
					icon: 'checkmark-circle',
					description: __( 'Your site is being backed up.' ),
					url: getRedirectUrl( 'calypso-activity-log', { site: siteRawUrl } ),
				};
			default:
				return {
					title: __( 'Oops!' ),
					icon: 'info',
					description: __( 'The Jetpack Backup status could not be retrieved at this time.' ),
					url: '',
				};
		}
	}

	getRewindBanner = () => {
		const { title, icon, description, url } = this.getRewindMessage();

		return (
			<Banner
				title={ title }
				icon={ icon }
				feature="rewind"
				description={ description }
				className="is-upgrade-premium jp-banner__no-border"
				href={ url }
			/>
		);
	};

	render() {
		const { rewindStatus, vaultPressData } = this.props;

		const rewindState = get( rewindStatus, 'state', false );
		const vaultPressEnabled = get( vaultPressData, [ 'data', 'features', 'backups' ], false );

		const hasRewindData = false !== rewindState;
		if ( ! hasRewindData && ! vaultPressEnabled ) {
			return (
				<SettingsCard
					header={ __( 'Jetpack Backup', { context: 'Settings header' } ) }
					hideButton
					action={ FEATURE_SITE_BACKUPS_JETPACK }
				>
					<SettingsGroup
						module={ { module: 'backups' } }
						support={ {
							text: __(
								'Backs up your site to the global WordPress.com servers, ' +
									'allowing you to restore your content in the event of an emergency or error.'
							),
							link: getRedirectUrl( 'jetpack-support-backup' ),
						} }
					>
						{ __( 'Checking site status…' ) }
					</SettingsGroup>
				</SettingsCard>
			);
		}

		return (
			<SettingsCard
				feature={ FEATURE_SITE_BACKUPS_JETPACK }
				{ ...this.props }
				header={ __( 'Jetpack Backup', { context: 'Settings header' } ) }
				hideButton
			>
				{ 'unavailable' === rewindState ? this.getVaultPressContent() : this.getRewindBanner() }
			</SettingsCard>
		);
	}
}
