import { getRedirectUrl } from '@automattic/jetpack-components';
import { RefreshJetpackSocialSettingsWrapper } from '@automattic/jetpack-publicize-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import Card from 'components/card';
import ConnectUserBar from 'components/connect-user-bar';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import React, { Component } from 'react';
import './style.scss';
import AutoConversionSection from './features/auto-conversion-section';
import SocialImageGeneratorSection from './features/social-image-generator-section';

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
				blogID = this.props.blogID,
				siteAdminUrl = this.props.siteAdminUrl,
				isActive = this.props.getOptionValue( 'publicize' ),
				hasSocialBasicFeatures = this.props.hasSocialBasicFeatures,
				hasSocialAdvancedFeatures = this.props.hasSocialAdvancedFeatures,
				hasSocialImageGenerator = this.props.hasSocialImageGenerator,
				hasAutoConversion = this.props.hasAutoConversion,
				isAtomicSite = this.props.isAtomicSite,
				activeFeatures = this.props.activeFeatures,
				userCanManageModules = this.props.userCanManageModules;

			const showUpgradeLink =
				! isAtomicSite &&
				activeFeatures &&
				activeFeatures.length > 0 &&
				isActive &&
				! hasSocialAdvancedFeatures &&
				isLinked;

			const shouldShowChildElements = isActive && ! this.props.isSavingAnyOption( 'publicize' );

			// We need to strip off the trailing slash for the pricing modal to open correctly.
			const redirectUrl = encodeURIComponent( siteAdminUrl.replace( /\/$/, '' ) );
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
							href={ getRedirectUrl( 'calypso-marketing-connections', {
								site: blogID ?? siteRawUrl,
							} ) }
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
					header={ _x( 'Jetpack Social', 'Settings header', 'jetpack' ) }
					module="publicize"
					hideButton
				>
					{ userCanManageModules && (
						<SettingsGroup
							hasChild
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
							<p>
								{ __(
									'Enable Jetpack Social and connect your social accounts to automatically share your content with your followers with a single click. When you publish a post, you will be able to share it on all connected accounts.',
									'jetpack'
								) }
							</p>
							{ showUpgradeLink && (
								<>
									<p>
										{ ! hasSocialBasicFeatures
											? createInterpolateElement(
													__(
														'<moreInfo>Upgrade to a Jetpack Social plan</moreInfo> to get unlimited shares and advanced media sharing options.',
														'jetpack'
													),
													{
														moreInfo: (
															<a
																href={ getRedirectUrl(
																	'jetpack-plugin-admin-page-sharings-screen',
																	{
																		site: siteRawUrl,
																		query: 'redirect_to=' + redirectUrl,
																	}
																) }
															/>
														),
													}
											  )
											: createInterpolateElement(
													__(
														'<moreInfo>Upgrade to the Jetpack Social Advanced plan</moreInfo> to get advanced media sharing options.',
														'jetpack'
													),
													{
														moreInfo: (
															<a
																href={ getRedirectUrl(
																	'jetpack-plugin-admin-page-sharings-screen',
																	{
																		site: siteRawUrl,
																		query: 'redirect_to=' + redirectUrl,
																	}
																) }
															/>
														),
													}
											  ) }
									</p>
								</>
							) }
							<ModuleToggle
								slug="publicize"
								disabled={ unavailableInOfflineMode }
								activated={ isActive }
								toggling={ this.props.isSavingAnyOption( 'publicize' ) }
								toggleModule={ this.props.toggleModuleNow }
							>
								{ __( 'Automatically share your posts to social networks', 'jetpack' ) }
							</ModuleToggle>
							<RefreshJetpackSocialSettingsWrapper
								shouldRefresh={ ! isActive && this.props.isSavingAnyOption( 'publicize' ) }
							>
								{ shouldShowChildElements && hasAutoConversion && <AutoConversionSection /> }
								{ shouldShowChildElements && hasSocialImageGenerator && (
									<SocialImageGeneratorSection />
								) }
							</RefreshJetpackSocialSettingsWrapper>
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
