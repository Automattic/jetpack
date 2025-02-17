import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	ConnectionManagement,
	features,
	getSocialScriptData,
} from '@automattic/jetpack-publicize-components';
import { siteHasFeature } from '@automattic/jetpack-script-data';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import React, { Component } from 'react';
import Card from 'components/card';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import './style.scss';
import { FormFieldset } from '../components/forms';
import { FEATURE_JETPACK_SOCIAL } from '../lib/plans/constants';
import SocialImageGeneratorSection from './features/social-image-generator-section';
import UtmToggleSection from './features/utm-toggle-section';

/**
 * Publicize module settings.
 */
export const Publicize = withModuleSettingsFormHelpers(
	class extends Component {
		trackClickConfigure() {
			analytics.tracks.recordJetpackClick( {
				target: 'configure-publicize',
				page: 'sharing',
			} );
		}

		componentDidUpdate() {
			const isActive = this.props.getOptionValue( 'publicize' );
			// Reload the page if Publicize is enabled.
			if ( isActive && ! getSocialScriptData().is_publicize_enabled ) {
				window.location.reload();
			}
		}

		render() {
			const isActive = this.props.getOptionValue( 'publicize' ),
				userCanManageModules = this.props.userCanManageModules;

			if ( ! userCanManageModules && ! isActive ) {
				return null;
			}

			const unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'publicize' ),
				isLinked = this.props.isLinked,
				siteRawUrl = this.props.siteRawUrl,
				blogID = this.props.blogID,
				siteAdminUrl = this.props.siteAdminUrl,
				hasPaidFeatures = this.props.hasPaidFeatures,
				hasSocialImageGenerator = siteHasFeature( features.IMAGE_GENERATOR ),
				isAtomicSite = this.props.isAtomicSite,
				activeFeatures = this.props.activeFeatures,
				useAdminUiV1 = this.props.useAdminUiV1,
				isOfflineMode = this.props.isOfflineMode;

			const showUpgradeLink =
				userCanManageModules &&
				! isAtomicSite &&
				activeFeatures &&
				activeFeatures.length > 0 &&
				isActive &&
				! hasPaidFeatures &&
				isLinked;

			const shouldShowChildElements =
				isActive && userCanManageModules && ! this.props.isSavingAnyOption( 'publicize' );

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

			return (
				<SettingsCard
					{ ...this.props }
					header={ _x( 'Jetpack Social', 'Settings header', 'jetpack' ) }
					module="publicize"
					hideButton
					feature={ FEATURE_JETPACK_SOCIAL }
					isDisabled={ isOfflineMode || ! isLinked }
				>
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
						{ showUpgradeLink ? (
							<p>
								{ createInterpolateElement(
									__(
										'<moreInfo>Upgrade to a Jetpack Social plan</moreInfo> to get advanced sharing options.',
										'jetpack'
									),
									{
										moreInfo: (
											<a
												href={ getRedirectUrl( 'jetpack-plugin-admin-page-sharings-screen', {
													site: siteRawUrl,
													query: 'redirect_to=' + redirectUrl,
												} ) }
											/>
										),
									}
								) }
							</p>
						) : null }
						<ModuleToggle
							slug="publicize"
							disabled={ isOfflineMode || ! isLinked || ! userCanManageModules }
							activated={ isActive }
							toggling={ this.props.isSavingAnyOption( 'publicize' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">
								{ __( 'Automatically share your posts to social networks', 'jetpack' ) }
							</span>
						</ModuleToggle>
						{ shouldShowChildElements && hasSocialImageGenerator && (
							<SocialImageGeneratorSection />
						) }
						{ shouldShowChildElements && <UtmToggleSection /> }
						{ isActive &&
						isLinked &&
						useAdminUiV1 &&
						! this.props.isSavingAnyOption( 'publicize' ) ? (
							<FormFieldset className="jp-settings__connection-management">
								<ConnectionManagement />
							</FormFieldset>
						) : null }
					</SettingsGroup>
					{ isActive && ! useAdminUiV1 && configCard() }
				</SettingsCard>
			);
		}
	}
);
