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
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';

export const Publicize = withModuleSettingsFormHelpers(
	class extends Component {
		trackClickConfigure() {
			analytics.tracks.recordJetpackClick( {
				target: 'configure-publicize',
				page: 'sharing',
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

				return isLinked ? (
					<Card
						compact
						className="jp-settings-card__configure-link"
						onClick={ this.trackClickConfigure }
						target="_blank"
						rel="noopener noreferrer"
						href={ 'https://wordpress.com/sharing/' + siteRawUrl }
					>
						{ __( 'Connect your social media accounts' ) }
					</Card>
				) : (
					<Card
						compact
						className="jp-settings-card__configure-link"
						target="_blank"
						rel="noopener noreferrer"
						href={ `${ connectUrl }&from=unlinked-user-connect-publicize` }
					>
						{ __( 'Create a Jetpack account to use this feature' ) }
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
					hideButton
				>
					{ userCanManageModules && (
						<SettingsGroup
							disableInDevMode
							module={ { module: 'publicize' } }
							support={ {
								text: __(
									'Allows you to automatically share your newest content on social media sites, ' +
										'including Facebook and Twitter.'
								),
								link: 'https://jetpack.com/support/publicize/',
							} }
						>
							<p>
								{ __(
									'Connect your website to the social media networks you use and share your content ' +
										'across all your social accounts with a single click. ' +
										'When you publish a post, it will appear on all connected accounts.'
								) }
							</p>
							<ModuleToggle
								slug="publicize"
								disabled={ unavailableInDevMode }
								activated={ isActive }
								toggling={ this.props.isSavingAnyOption( 'publicize' ) }
								toggleModule={ this.props.toggleModuleNow }
							>
								{ __( 'Automatically share your posts to social networks' ) }
							</ModuleToggle>
						</SettingsGroup>
					) }
					{ isActive && configCard() }
				</SettingsCard>
			);
		}
	}
);
