/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import analytics from 'lib/analytics';
import get from 'lodash/get';
import { getPlanClass } from 'lib/plans/constants';

/**
 * Internal dependencies
 */
import { FEATURE_SECURITY_SCANNING_JETPACK } from 'lib/plans/constants';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { getVaultPressData, isFetchingVaultPressData } from 'state/at-a-glance';
import { getSitePlan, isFetchingSiteData } from 'state/site';
import includes from 'lodash/includes';

export const BackupsScan = moduleSettingsForm(
	React.createClass( {

		toggleModule( name, value ) {
			this.props.updateFormStateOptionValue( name, ! value );
		},

		trackConfigureClick() {
			analytics.tracks.recordJetpackClick( 'configure-scan' );
		},

		render() {
			const backupsAndScansEnabled = (
					get( this.props.vaultPressData, [ 'data', 'features', 'backups' ], false ) &&
					get( this.props.vaultPressData, [ 'data', 'features', 'security' ], false )
				),
				planClass = getPlanClass( this.props.sitePlan.product_slug );
			let cardText = '';

			if ( this.props.isDevMode ) {
				cardText = __( 'Unavailable in Dev Mode.' );
			} else if ( ! this.props.isFetchingSiteData && ! this.props.isFetchingVaultPressData ) {
				if ( backupsAndScansEnabled ) {
					cardText = __( 'Your site is backed up and threat-free.' );
				} else if ( includes( [ 'is-personal-plan', 'is-premium-plan', 'is-business-plan' ], planClass ) ) {
					if ( 'is-personal-plan' === planClass ) {
						cardText = __( "You have paid for backups but they're not yet active." );
					} else if ( includes( [ 'is-premium-plan', 'is-business-plan' ], planClass ) ) {
						cardText = __( 'You have paid for backups and security scanning but they’re not yet active.' );
					}
					cardText += ' ' + __( 'Click "Set Up" to finish installation.' );
				}
			} else if ( this.props.isFetchingSiteData || this.props.isFetchingVaultPressData ) {
				cardText += ' ' + __( 'Checking site status…' );
			}

			return (
				<SettingsCard
					feature={ FEATURE_SECURITY_SCANNING_JETPACK }
					{ ...this.props }
					header={ __( 'Backups and security scanning', { context: 'Settings header' } ) }
					action="scan"
					hideButton>
					<SettingsGroup disableInDevMode module={ { module: 'backups' } } support="https://help.vaultpress.com/get-to-know/">
						{
							cardText
						}
					</SettingsGroup>
					{
						( ! this.props.isUnavailableInDevMode( 'backups' ) && backupsAndScansEnabled ) && (
							<Card compact className="jp-settings-card__configure-link" onClick={ this.trackConfigureClick } href="https://dashboard.vaultpress.com/">{ __( 'Configure your Security Scans' ) }</Card>
						)
					}
				</SettingsCard>
			);
		}
	} )
);

export default connect(
	( state ) => {
		return {
			sitePlan: getSitePlan( state ),
			isFetchingSiteData: isFetchingSiteData( state ),
			vaultPressData: getVaultPressData( state ),
			isFetchingVaultPressData: isFetchingVaultPressData( state )
		};
	}
)( BackupsScan );
