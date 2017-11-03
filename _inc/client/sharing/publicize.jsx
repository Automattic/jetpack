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

export const Publicize = moduleSettingsForm(
	class extends Component {
		trackClickConfigure() {
			analytics.tracks.recordJetpackClick( {
				target: 'configure-publicize',
				page: 'sharing'
			} );
		}

		render() {
			const unavailableInDevMode = this.props.isUnavailableInDevMode( 'publicize' ),
				isLinked = this.props.isLinked,
				connectUrl = this.props.connectUrl,
				siteRawUrl = this.props.siteRawUrl,
				isActive = this.props.getOptionValue( 'publicize' ),
				userCanManageModules = this.props.userCanManageModules;

			const configCard = () => {
				if ( unavailableInDevMode ) {
					return;
				}

				return isLinked
					? (
						<Card
							compact
							className="jp-settings-card__configure-link"
							onClick={ this.trackClickConfigure }
							href={ 'https://wordpress.com/sharing/' + siteRawUrl }>
							{ __( 'Connect your social media accounts' ) }
						</Card>
					)
					: (
						<Card
							compact
							className="jp-settings-card__configure-link"
							href={ `${ connectUrl }&from=unlinked-user-connect-publicize` }>
							{ __( 'Connect your user account to WordPress.com to use this feature' ) }
						</Card>
					);
			};

			if ( ! userCanManageModules && ! isActive ) {
				return null;
			}

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Publicize connections', { context: 'Settings header' } ) }
					module="publicize"
					hideButton>
					{
						userCanManageModules && (
							<SettingsGroup disableInDevMode module={ { module: 'publicize' } }
								support="https://jetpack.com/support/publicize/"
							>
								<ModuleToggle
									slug="publicize"
									disabled={ unavailableInDevMode }
									activated={ isActive }
									toggling={ this.props.isSavingAnyOption( 'publicize' ) }
									toggleModule={ this.props.toggleModuleNow }>
									{
										__( 'Automatically share your posts to social networks' )
									}
								</ModuleToggle>
							</SettingsGroup>
						)
					}
					{
						isActive && configCard()
					}
				</SettingsCard>
			);
		}
	}
);
