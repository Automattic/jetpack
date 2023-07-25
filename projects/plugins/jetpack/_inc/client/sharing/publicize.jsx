import { getRedirectUrl } from '@automattic/jetpack-components';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { __, _x } from '@wordpress/i18n';
import Card from 'components/card';
import ConnectUserBar from 'components/connect-user-bar';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import React, { Component } from 'react';

export const Publicize = withModuleSettingsFormHelpers(
	class extends Component {
		trackClickConfigure() {
			analytics.tracks.recordJetpackClick( {
				target: 'configure-publicize',
				page: 'sharing',
			} );
		}

		render() {
			const unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'publicize' ),
				isLinked = this.props.isLinked,
				isOfflineMode = this.props.isOfflineMode,
				siteRawUrl = this.props.siteRawUrl,
				isActive = this.props.getOptionValue( 'publicize' ),
				hasSocialBasicFeatures = this.props.hasSocialBasicFeatures,
				hasSocialAdvancedFeatures = this.props.hasSocialAdvancedFeatures,
				activeFeatures = this.props.activeFeatures,
				userCanManageModules = this.props.userCanManageModules;

			const showUpgradeLink =
				activeFeatures && activeFeatures.length > 0 && isActive && ! hasSocialAdvancedFeatures;

			const jetpackSocialText = __(
				'Connect your website to the social media networks you use and share your content across all your social accounts with a single click. When you publish a post, it will appear on all connected accounts.',
				'jetpack'
			);

			const jetpackSocialBasicUpgradeText = __( 'Upgrade to a Jetpack Social plan', 'jetpack' );
			const jetpackSocialAdvancedText = __(
				'Upgrade to the Jetpack Social Advanced plan',
				'jetpack'
			);

			const jetpackSocialBasicUpgradeTextSuffix = __(
				'to get unlimited shares and advanced media sharing options.',
				'jetpack'
			);

			const jetpackSocialAdvancedUpgradeTextSuffix = __(
				'to get advanced media sharing options.',
				'jetpack'
			);

			const configCard = () => {
				if ( unavailableInOfflineMode ) {
					return;
				}

				return (
					isLinked && (
						<Card
							compact
							className="jp-settings-card__configure-link"
							onClick={ this.trackClickConfigure }
							target="_blank"
							rel="noopener noreferrer"
							href={ getRedirectUrl( 'calypso-marketing-connections', { site: siteRawUrl } ) }
						>
							{ __( 'Connect your social media accounts', 'jetpack' ) }
						</Card>
					)
				);
			};

			if ( ! userCanManageModules && ! isActive ) {
				return null;
			}

			return (
				<SettingsCard
					{ ...this.props }
					header={ _x( 'Jetpack Social connections', 'Settings header', 'jetpack' ) }
					module="publicize"
					hideButton
				>
					{ userCanManageModules && (
						<SettingsGroup
							disableInOfflineMode
							disableInSiteConnectionMode
							module={ { module: 'publicize' } }
							support={ {
								text: __(
									'Allows you to automatically share your newest content on social media sites, including Facebook and LinkedIn.',
									'jetpack'
								),
								link: getRedirectUrl( 'jetpack-support-publicize' ),
							} }
						>
							<p>{ jetpackSocialText }</p>
							{ showUpgradeLink && (
								<React.Fragment>
									<p>
										<a
											href={ getRedirectUrl( 'jetpack-connections-sharing-screen', {
												site: getSiteFragment(),
												query: 'redirect_to=' + encodeURIComponent( window.location.href ),
											} ) }
										>
											{ showUpgradeLink && ! hasSocialBasicFeatures
												? jetpackSocialBasicUpgradeText
												: jetpackSocialAdvancedText }
										</a>
										&nbsp;
										{ showUpgradeLink && ! hasSocialBasicFeatures
											? jetpackSocialBasicUpgradeTextSuffix
											: jetpackSocialAdvancedUpgradeTextSuffix }
									</p>
								</React.Fragment>
							) }
							<ModuleToggle
								slug="publicize"
								disabled={ unavailableInOfflineMode || ! this.props.isLinked }
								activated={ isActive }
								toggling={ this.props.isSavingAnyOption( 'publicize' ) }
								toggleModule={ this.props.toggleModuleNow }
							>
								{ __( 'Automatically share your posts to social networks', 'jetpack' ) }
							</ModuleToggle>
						</SettingsGroup>
					) }

					{ ! isLinked && ! isOfflineMode && (
						<ConnectUserBar
							feature="publicize"
							featureLabel={ __( 'Jetpack Social', 'jetpack' ) }
							text={ __( 'Connect to add your social media accounts.', 'jetpack' ) }
						/>
					) }

					{ isActive && configCard() }
				</SettingsCard>
			);
		}
	}
);
