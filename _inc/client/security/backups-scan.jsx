/**
 * External dependencies
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { numberFormat, translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import analytics from 'lib/analytics';
import { get, includes } from 'lodash';
import Banner from 'components/banner';

/**
 * Internal dependencies
 */
import { getPlanClass, FEATURE_SECURITY_SCANNING_JETPACK } from 'lib/plans/constants';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { getVaultPressData, getVaultPressScanThreatCount } from 'state/at-a-glance';
import { getSitePlan } from 'state/site';
import { isModuleActivated } from 'state/modules';
import { showBackups } from 'state/initial-state';

class LoadingCard extends Component {
	render() {
		return (
			<SettingsCard
				header={ __( 'Backups and security scanning', { context: 'Settings header' } ) }
				hideButton
				action="scan"
			>
				<SettingsGroup
					disableInDevMode
					module={ { module: 'backups' } }
					support={ {
						text: __(
							'Backs up your site to the global WordPress.com servers, ' +
								'allowing you to restore your content in the event of an emergency or error.'
						),
						link: 'https://help.vaultpress.com/get-to-know/',
					} }
				>
					{ __( 'Checking site status…' ) }
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

class BackupsScanRewind extends Component {
	static propTypes = {
		isDevMode: PropTypes.bool,
		siteRawUrl: PropTypes.string,
		rewindState: PropTypes.string,
	};

	static defaultProps = {
		isDevMode: false,
		siteRawUrl: '',
		rewindState: '',
	};

	getRewindMessage() {
		const { siteRawUrl, rewindState } = this.props;

		switch ( rewindState ) {
			case 'provisioning':
				return {
					title: __( 'Provisioning' ),
					icon: 'info',
					description: __( 'Backups and Scan are being configured for your site.' ),
					url: '',
				};
			case 'awaiting_credentials':
				return {
					title: __( 'Awaiting credentials' ),
					icon: 'notice',
					description: __(
						'You need to enter your server credentials to finish configuring Backups and Scan.'
					),
					url: 'https://wordpress.com/settings/security/' + siteRawUrl,
				};
			case 'active':
				return {
					title: __( 'Active' ),
					icon: 'checkmark-circle',
					description: __(
						'Your site is being backed up in real time and regularly scanned for security threats.'
					),
					url: 'https://wordpress.com/activity-log/' + siteRawUrl,
				};
		}
	}

	getCardText = () => {
		if ( this.props.isDevMode ) {
			return __( 'Unavailable in Dev Mode.' );
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
				header={ __( 'Backups and security scanning', { context: 'Settings header' } ) }
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

			if ( this.props.isDevMode ) {
				return __( 'Unavailable in Dev Mode.' );
			}

			// We check if the features are active first, rather than the plan because it's possible the site is on a
			// VP-only plan, purchased before Jetpack plans existed.
			if ( backupsEnabled && scanEnabled ) {
				const threats = this.props.hasThreats;
				if ( threats ) {
					return (
						<div>
							<strong>
								{ __( 'Uh oh, %(number)s threat found.', 'Uh oh, %(number)s threats found.', {
									count: threats,
									args: {
										number: numberFormat( threats ),
									},
								} ) }
							</strong>
							<br />
							<br />
							{ __( '{{a}}View details{{/a}}', {
								components: { a: <a href="https://dashboard.vaultpress.com/" /> },
							} ) }
							<br />
							{ __( '{{a}}Contact Support{{/a}}', {
								components: { a: <a href="https://jetpack.com/support" /> },
							} ) }
						</div>
					);
				}
				return __( 'Your site is backed up and threat-free.' );
			}

			// Only return here if backups enabled and site on on free/personal plan.  If they're on a higher plan,
			// then they have access to scan as well, and need to set it up!
			if ( backupsEnabled && includes( [ 'is-free-plan', 'is-personal-plan' ], planClass ) ) {
				return __( 'Your site is backed up.' );
			}

			// Nothing is enabled. We can show upgrade/setup text now.
			switch ( planClass ) {
				case 'is-personal-plan':
					cardText = __( "You have paid for backups but they're not yet active." );
					cardText += ' ' + __( 'Click "Set Up" to finish installation.' );
					break;
				case 'is-premium-plan':
				case 'is-business-plan':
					cardText = __(
						'You have paid for backups and security scanning but they’re not yet active.'
					);
					cardText += ' ' + __( 'Click "Set Up" to finish installation.' );
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

			if ( ! hasRewindData || ( this.props.vaultPressActive && ! hasVpData ) ) {
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
					header={ __( 'Backups and security scanning', { context: 'Settings header' } ) }
					action="scan"
					hideButton
				>
					<SettingsGroup
						disableInDevMode
						module={ { module: 'backups' } }
						support={ {
							text: __(
								'Backs up your site to the global WordPress.com servers, ' +
									'allowing you to restore your content in the event of an emergency or error.'
							),
							link: 'https://help.vaultpress.com/get-to-know/',
						} }
					>
						{ this.getCardText() }
					</SettingsGroup>
					{ ! this.props.isUnavailableInDevMode( 'backups' ) && scanEnabled && (
						<Card
							compact
							className="jp-settings-card__configure-link"
							onClick={ this.trackConfigureClick }
							href="https://dashboard.vaultpress.com/"
						>
							{ __( 'Configure your Security Scans' ) }
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
