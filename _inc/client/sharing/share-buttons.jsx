/**
 * External dependencies
 */
import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';

export const ShareButtons = moduleSettingsForm(
	class extends Component {
		trackClickConfigure() {
			analytics.tracks.recordJetpackClick( {
				target: 'configure-sharing',
				page: 'sharing'
			} );
		}

		render() {
			const isLinked = this.props.isLinked,
				connectUrl = this.props.connectUrl,
				siteRawUrl = this.props.siteRawUrl,
				siteAdminUrl = this.props.siteAdminUrl,
				isDevMode = this.props.isDevMode,
				isActive = this.props.getOptionValue( 'sharedaddy' );

			const configCard = () => {
				if ( isDevMode ) {
					return <Card compact className="jp-settings-card__configure-link" href={ siteAdminUrl + 'options-general.php?page=sharing' }>{ __( 'Configure your sharing buttons' ) }</Card>;
				}

				if ( isLinked ) {
					return <Card compact className="jp-settings-card__configure-link" onClick={ this.trackClickConfigure } href={ 'https://wordpress.com/sharing/buttons/' + siteRawUrl }>{ __( 'Configure your sharing buttons' ) }</Card>;
				}

				return <Card compact className="jp-settings-card__configure-link" href={ `${ connectUrl }&from=unlinked-user-connect-sharing` }>{ __( 'Connect your user account to WordPress.com to use this feature' ) }</Card>;
			};

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Sharing buttons', { context: 'Settings header' } ) }
					module="sharing"
					hideButton>
					<SettingsGroup disableInDevMode module={ { module: 'sharing' } } support="https://jetpack.com/support/sharing/">
						<ModuleToggle
							slug="sharedaddy"
							activated={ isActive }
							toggling={ this.props.isSavingAnyOption( 'sharedaddy' ) }
							toggleModule={ this.props.toggleModuleNow }>
							{
								__( 'Add sharing buttons to your posts' )
							}
							</ModuleToggle>
					</SettingsGroup>
					{
						isActive && configCard()
					}
				</SettingsCard>
			);
		}
	}
);
