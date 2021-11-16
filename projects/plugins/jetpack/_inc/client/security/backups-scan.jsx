/**
 * External dependencies
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, _x, _n, sprintf } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Banner from 'components/banner';
import Card from 'components/card';
import { getPlanClass, FEATURE_SECURITY_SCANNING_JETPACK } from 'lib/plans/constants';
import { getVaultPressData, getVaultPressScanThreatCount } from 'state/at-a-glance';
import { getSitePlan } from 'state/site';
import { isModuleActivated } from 'state/modules';
import { numberFormat } from 'components/number-format';
import QueryRewindStatus from 'components/data/query-rewind-status';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { showBackups } from 'state/initial-state';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';

class LoadingCard extends Component {
	render() {
		return (
			<SettingsCard
				header={ _x( 'Backups and security scanning', 'Settings header', 'jetpack' ) }
				hideButton
				action="scan"
			>
				<SettingsGroup
					disableInOfflineMode
					module={ { module: 'backups' } }
					support={ {
						text: __(
							'Backs up your site to the global WordPress.com servers, allowing you to restore your content in the event of an emergency or error.',
							'jetpack'
						),
						link: getRedirectUrl( 'vaultpress-help-get-to-know' ),
					} }
				>
					{ __( 'Checking site status…', 'jetpack' ) }
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

class BackupsScanRewind extends Component {
	static propTypes = {
		isOfflineMode: PropTypes.bool,
		siteRawUrl: PropTypes.string,
		rewindState: PropTypes.string,
	};

	static defaultProps = {
		isOfflineMode: false,
		siteRawUrl: '',
		rewindState: '',
	};

	getRewindMessage() {
		const { siteRawUrl, rewindState } = this.props;

		switch ( rewindState ) {
			case 'provisioning':
				return {
					title: __( 'Provisioning', 'jetpack' ),
					icon: 'info',
					description: __( 'Backups and Scan are being configured for your site.', 'jetpack' ),
					url: '',
				};
			case 'awaiting_credentials':
				return {
					title: __( 'Awaiting credentials', 'jetpack' ),
					icon: 'notice',
					description: __(
						'You need to enter your server credentials to finish configuring Backups and Scan.',
						'jetpack'
					),
					url: getRedirectUrl( 'jetpack-settings-security-credentials', { site: siteRawUrl } ),
				};
			case 'active':
				return {
					title: __( 'Active', 'jetpack' ),
					icon: 'checkmark-circle',
					description: __( 'Your site is connected to Jetpack Backup and Scan.', 'jetpack' ),
					url: getRedirectUrl( 'calypso-activity-log', { site: siteRawUrl } ),
				};
			default:
				return {
					title: __( 'Oops!', 'jetpack' ),
					icon: 'info',
					description: __(
						'The Jetpack Backup and Scan status could not be retrieved at this time.',
						'jetpack'
					),
					url: '',
				};
		}
	}

	getCardText = () => {
		if ( this.props.isOfflineMode ) {
			return __( 'Unavailable in Offline Mode.', 'jetpack' );
		}

		const { title, icon, description, url } = this.getRewindMessage();

		return (
			<Banner
				title={ title }
				icon={ icon }
				feature={ 'rewind' }
				description={ description }
				className="is-upgrade-premium jp-banner__no-border"
				href={ url }
			/>
		);
	};

	render() {
		return (
			<SettingsCard
				feature={ 'rewind' }
				{ ...this.props }
				header={ _x( 'Backups and security scanning', 'Settings header', 'jetpack' ) }
				action={ 'rewind' }
				hideButton
			>
				{ this.getCardText() }
			</SettingsCard>
		);
	}
}

export const BackupsScan = withModuleSettingsFormHelpers(
	class extends Component {
		toggleModule = ( name, value ) => {
			this.props.updateFormStateOptionValue( name, ! value );
		};

		trackConfigureClick = () => {
			analytics.tracks.recordJetpackClick( 'configure-scan' );
		};

		getCardText() {
			const backupsEnabled = get(
					this.props.vaultPressData,
					[ 'data', 'features', 'backups' ],
					false
				),
				scanEnabled = get( this.props.vaultPressData, [ 'data', 'features', 'security' ], false ),
				planClass = getPlanClass( this.props.sitePlan.product_slug );
			let cardText = '';

			if ( this.props.isOfflineMode ) {
				return __( 'Unavailable in Offline Mode.', 'jetpack' );
			}

			// We check if the features are active first, rather than the plan because it's possible the site is on a
			// VP-only plan, purchased before Jetpack plans existed.
			if ( backupsEnabled && scanEnabled ) {
				const threats = this.props.hasThreats;
				if ( threats ) {
					return (
						<div>
							<strong>
								{ sprintf(
									/* Translators: placeholder is a number (of threats). */
									_n( 'Uh oh, %s threat found.', 'Uh oh, %s threats found.', threats, 'jetpack' ),
									numberFormat( threats )
								) }
							</strong>
							<br />
							<br />
							{ createInterpolateElement( __( '<a>View details</a>', 'jetpack' ), {
								a: <a href={ getRedirectUrl( 'vaultpress-dashboard' ) } />,
							} ) }
							<br />
							{ createInterpolateElement( __( '<a>Contact Support</a>', 'jetpack' ), {
								a: <a href={ getRedirectUrl( 'jetpack-support' ) } />,
							} ) }
						</div>
					);
				}
				return __(
					'Your site is connected to VaultPress for backups and security scanning.',
					'jetpack'
				);
			}

			// Only return here if backups enabled and site on on free/personal plan, or if Jetpack Backup is in use.
			// If they're on a higher plan, then they have access to scan as well, and need to set it up!
			if (
				backupsEnabled &&
				includes(
					[ 'is-free-plan', 'is-personal-plan', 'is-daily-backup-plan', 'is-realtime-backup-plan' ],
					planClass
				)
			) {
				return __( 'Your site is connected to VaultPress for backups.', 'jetpack' );
			}

			// Nothing is enabled. We can show upgrade/setup text now.
			switch ( planClass ) {
				case 'is-personal-plan':
					cardText = __( "You have paid for backups but they're not yet active.", 'jetpack' );
					cardText += ' ' + __( 'Click "Set Up" to finish installation.', 'jetpack' );
					break;
				case 'is-premium-plan':
				case 'is-business-plan':
					cardText = __(
						'You have paid for backups and security scanning but they’re not yet active.',
						'jetpack'
					);
					cardText += ' ' + __( 'Click "Set Up" to finish installation.', 'jetpack' );
					break;
			}

			return cardText;
		}

		render() {
			if ( ! this.props.showBackups ) {
				return null;
			}

			const scanEnabled = get(
				this.props.vaultPressData,
				[ 'data', 'features', 'security' ],
				false
			);
			const rewindState = get( this.props.rewindStatus, [ 'state' ], false );
			const hasRewindData = false !== rewindState;
			const hasVpData =
				this.props.vaultPressData !== 'N/A' &&
				false !== get( this.props.vaultPressData, [ 'data' ], false );

			if ( ! hasRewindData && this.props.vaultPressActive && ! hasVpData ) {
				return <LoadingCard />;
			}

			// Backup & Scan is working in this site.
			if ( includes( [ 'provisioning', 'awaiting_credentials', 'active' ], rewindState ) ) {
				return <BackupsScanRewind { ...this.props } rewindState={ rewindState } />;
			}

			return (
				<SettingsCard
					feature={ FEATURE_SECURITY_SCANNING_JETPACK }
					{ ...this.props }
					header={ _x( 'Backups and security scanning', 'Settings header', 'jetpack' ) }
					action="scan"
					hideButton
				>
					<QueryRewindStatus />
					<SettingsGroup
						disableInOfflineMode
						module={ { module: 'backups' } }
						support={ {
							text: __(
								'Backs up your site to the global WordPress.com servers, allowing you to restore your content in the event of an emergency or error.',
								'jetpack'
							),
							link: getRedirectUrl( 'vaultpress-help-get-to-know' ),
						} }
					>
						{ this.getCardText() }
					</SettingsGroup>
					{ ! this.props.isUnavailableInOfflineMode( 'backups' ) && scanEnabled && (
						<Card
							compact
							className="jp-settings-card__configure-link"
							onClick={ this.trackConfigureClick }
							target="_blank"
							href={ getRedirectUrl( 'vaultpress-dashboard' ) }
						>
							{ __( 'Configure your Security Scans', 'jetpack' ) }
						</Card>
					) }
				</SettingsCard>
			);
		}
	}
);

export default connect( state => {
	return {
		sitePlan: getSitePlan( state ),
		vaultPressData: getVaultPressData( state ),
		hasThreats: getVaultPressScanThreatCount( state ),
		vaultPressActive: isModuleActivated( state, 'vaultpress' ),
		showBackups: showBackups( state ),
	};
} )( BackupsScan );
