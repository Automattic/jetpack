/**
 * External dependencies
 */
import React, { Component } from 'react';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Card from 'components/card';
import getRedirectUrl from 'lib/jp-redirect';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';
import ConnectUserBar from 'components/connect-user-bar';

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
				connectUrl = this.props.connectUrl,
				siteRawUrl = this.props.siteRawUrl,
				isActive = this.props.getOptionValue( 'publicize' ),
				userCanManageModules = this.props.userCanManageModules;

			const configCard = () => {
				if ( unavailableInOfflineMode ) {
					return;
				}

				return isLinked ? (
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
				) : (
					<Card
						compact
						className="jp-settings-card__configure-link"
						target="_blank"
						rel="noopener noreferrer"
						href={ `${ connectUrl }&from=unlinked-user-connect-publicize` }
					>
						{ __( 'Create a Jetpack account to use this feature', 'jetpack' ) }
					</Card>
				);
			};

			if ( ! userCanManageModules && ! isActive ) {
				return null;
			}

			return (
				<SettingsCard
					{ ...this.props }
					header={ _x( 'Publicize connections', 'Settings header', 'jetpack' ) }
					module="publicize"
					hideButton
				>
					{ userCanManageModules && (
						<SettingsGroup
							disableInOfflineMode
							disableInUserlessMode
							module={ { module: 'publicize' } }
							support={ {
								text: __(
									'Allows you to automatically share your newest content on social media sites, including Facebook and Twitter.',
									'jetpack'
								),
								link: getRedirectUrl( 'jetpack-support-publicize' ),
							} }
						>
							<p>
								{ __(
									'Connect your website to the social media networks you use and share your content across all your social accounts with a single click. When you publish a post, it will appear on all connected accounts.',
									'jetpack'
								) }
							</p>
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

					{ ! this.props.isLinked && (
						<ConnectUserBar
							feature="publicize"
							text={ __(
								'Publicize provided by the WordPress.com cloud. Sign in to configure the publicize connections.',
								'jetpack'
							) }
						/>
					) }

					{ isActive && configCard() }
				</SettingsCard>
			);
		}
	}
);
