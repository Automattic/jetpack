/**
 * External dependencies
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { translate as __ } from 'i18n-calypso';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import { LoadingCard } from './loading-card';
import Banner from 'components/banner';
import SettingsCard from 'components/settings-card';

export class JetpackBackup extends Component {
	static propTypes = {
		siteRawUrl: PropTypes.string,
		rewindState: PropTypes.string,
	};

	static defaultProps = {
		siteRawUrl: '',
		rewindState: '',
	};

	getRewindMessage() {
		const { siteRawUrl, rewindStatus } = this.props;
		const rewindState = get( rewindStatus, [ 'state' ], false );

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
					url: 'https://wordpress.com/settings/security/' + siteRawUrl,
				};
			case 'active':
				return {
					title: __( 'Active' ),
					icon: 'checkmark-circle',
					description: __( 'Your site is being backed up.' ),
					url: 'https://wordpress.com/activity-log/' + siteRawUrl,
				};
			default:
				return {
					title: '',
					icon: '',
					description: '',
					url: '',
				};
		}
	}

	getBanner = () => {
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
		const { rewindStatus } = this.props;

		const rewindState = get( rewindStatus, [ 'state' ], false );

		const hasRewindData = false !== rewindState;
		if ( ! hasRewindData ) {
			return (
				<LoadingCard
					header={ __( 'Jetpack Backup', { context: 'Settings header' } ) }
					action="rewind"
					module={ { module: 'backups' } }
					support={ {
						text: __(
							'Backs up your site to the global WordPress.com servers, ' +
								'allowing you to restore your content in the event of an emergency or error.'
						),
						link: 'https://help.vaultpress.com/get-to-know/',
					} }
				/>
			);
		}

		return (
			<SettingsCard
				feature={ 'rewind' }
				{ ...this.props }
				header={ __( 'Jetpack Backup', { context: 'Settings header' } ) }
				action={ 'rewind' }
				hideButton
			>
				{ this.getBanner() }
			</SettingsCard>
		);
	}
}
