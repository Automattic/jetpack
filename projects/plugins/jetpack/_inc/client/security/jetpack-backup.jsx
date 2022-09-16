import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import Banner from 'components/banner';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { FEATURE_SITE_BACKUPS_JETPACK } from 'lib/plans/constants';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

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
						'Backs up your site to the global WordPress.com servers, allowing you to restore your content in the event of an emergency or error.',
						'jetpack'
					),
					link: getRedirectUrl( 'jetpack-support-backup' ),
				} }
			>
				{ __( 'Your site is connected to VaultPress for backups.', 'jetpack' ) }
			</SettingsGroup>
		);
	};

	getRewindMessage() {
		const { siteRawUrl, rewindStatus } = this.props;
		const rewindState = get( rewindStatus, 'state', false );

		switch ( rewindState ) {
			case 'provisioning':
				return {
					title: __( 'Provisioning', 'jetpack' ),
					icon: 'info',
					description: __( 'Jetpack Backup is being configured for your site.', 'jetpack' ),
					url: '',
				};
			case 'awaiting_credentials':
				return {
					title: __( 'Set up your server credentials to get back online quickly', 'jetpack' ),
					icon: 'notice',
					description: __(
						'Add SSH, SFTP, or FTP credentials to enable one click site restores',
						'jetpack'
					),
					url: getRedirectUrl( 'jetpack-settings-security-credentials', { site: siteRawUrl } ),
				};
			case 'active':
				return {
					title: __( 'Active', 'jetpack' ),
					icon: 'checkmark-circle',
					description: __( 'Your site is connected to Jetpack Backup.', 'jetpack' ),
					url: getRedirectUrl( 'calypso-activity-log', { site: siteRawUrl } ),
				};
			default:
				return {
					title: __( 'Oops!', 'jetpack' ),
					icon: 'info',
					description: __(
						'The Jetpack Backup status could not be retrieved at this time.',
						'jetpack'
					),
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
					header={ _x( 'Jetpack Backup', 'Settings header', 'jetpack' ) }
					hideButton
					action={ FEATURE_SITE_BACKUPS_JETPACK }
				>
					<SettingsGroup
						module={ { module: 'backups' } }
						support={ {
							text: __(
								'Backs up your site to the global WordPress.com servers, allowing you to restore your content in the event of an emergency or error.',
								'jetpack'
							),
							link: getRedirectUrl( 'jetpack-support-backup' ),
						} }
					>
						{ __( 'Checking site status…', 'jetpack' ) }
					</SettingsGroup>
				</SettingsCard>
			);
		}

		return (
			<SettingsCard
				feature={ FEATURE_SITE_BACKUPS_JETPACK }
				{ ...this.props }
				header={ _x( 'Jetpack Backup', 'Settings header', 'jetpack' ) }
				hideButton
			>
				{ 'unavailable' === rewindState ? this.getVaultPressContent() : this.getRewindBanner() }
			</SettingsCard>
		);
	}
}
