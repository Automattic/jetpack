import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import Card from 'components/card';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SimpleNotice from 'components/notice';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import React, { Component } from 'react';

export const ShareButtons = withModuleSettingsFormHelpers(
	class extends Component {
		trackClickConfigure() {
			analytics.tracks.recordJetpackClick( {
				target: 'configure-sharing',
				page: 'sharing',
			} );
		}

		render() {
			const isLinked = this.props.isLinked,
				siteRawUrl = this.props.siteRawUrl,
				blogID = this.props.blogID,
				siteAdminUrl = this.props.siteAdminUrl,
				isOfflineMode = this.props.isOfflineMode,
				siteUsesWpAdminInterface = this.props.siteUsesWpAdminInterface,
				hasSharingBlock = this.props.hasSharingBlock,
				isBlockTheme = this.props.isBlockTheme,
				isActive = this.props.getOptionValue( 'sharedaddy' );

			const shouldShowSharingBlock = isBlockTheme && hasSharingBlock;

			const sharingBlockSupporUrl = getRedirectUrl( 'jetpack-support-sharing-block' );
			const sharingModuleSupportUrl = getRedirectUrl( 'jetpack-support-sharing' );

			/**
			 * Sharing configuration link.
			 *
			 * This link can be different depending on your site setup:
			 * - Do you use a block-based theme and is the sharing block available?
			 * - Is the site connected to WordPress.com?
			 * - Is the site in offline mode?
			 * - Is the site using the classic admin interface?
			 *
			 * @returns {React.ReactNode} A card with the sharing configuration link.
			 */
			const configCard = () => {
				const cardProps = {
					compact: true,
					className: 'jp-settings-card__configure-link',
					href: `${ siteAdminUrl }options-general.php?page=sharing`,
				};

				if ( shouldShowSharingBlock ) {
					cardProps.href = `${ siteAdminUrl }site-editor.php?path=%2Fwp_template`;
				} else if ( isLinked && ! isOfflineMode && ! siteUsesWpAdminInterface ) {
					cardProps.href = getRedirectUrl( 'calypso-marketing-sharing-buttons', {
						site: blogID ?? siteRawUrl,
					} );
					cardProps.onClick = this.trackClickConfigure;
					cardProps.target = '_blank';
					cardProps.rel = 'noopener noreferrer';
				}

				return <Card { ...cardProps }>{ __( 'Configure your sharing buttons', 'jetpack' ) }</Card>;
			};

			/**
			 * Sharing module toggle, and suggestion to use the sharing block.
			 *
			 * If the sharing block is available,
			 * we suggest to use it instead of the legacy module.
			 *
			 * @returns {React.ReactNode} A module toggle.
			 */
			const moduleToggle = () => {
				const toggle = (
					<ModuleToggle
						slug="sharedaddy"
						activated={ isActive }
						toggling={ this.props.isSavingAnyOption( 'sharedaddy' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						{ __( 'Add sharing buttons to your posts and pages', 'jetpack' ) }
					</ModuleToggle>
				);

				// If the sharing block is not available,
				// only display the legacy module toggle.
				if ( ! shouldShowSharingBlock ) {
					return toggle;
				}

				const featureDescription = isActive
					? createInterpolateElement(
							__(
								'You are using a block-based theme. We recommend that you disable the legacy sharing feature above and add a sharing button block to your themes’s template instead. <a>Discover how</a>.',
								'jetpack'
							),
							{
								a: <ExternalLink href={ sharingBlockSupporUrl } />,
							}
					  )
					: createInterpolateElement(
							__(
								'You are using a block-based theme. Instead of enabling Jetpack’s legacy sharing buttons above, we would recommend that you add a sharing button block to your themes’s template in the site editor instead. <a>Discover how</a>.',
								'jetpack'
							),
							{
								a: <ExternalLink href={ sharingBlockSupporUrl } />,
							}
					  );

				// If the sharing block is available,
				// Let's suggest the sharing block as an alternative.
				return (
					<>
						{ toggle }
						<SimpleNotice
							showDismiss={ false }
							status={ 'is-info' }
							className="jp-settings-sharing__block-theme-description"
						>
							{ featureDescription }
						</SimpleNotice>
					</>
				);
			};

			return (
				<SettingsCard
					{ ...this.props }
					header={ _x( 'Sharing buttons', 'Settings header', 'jetpack' ) }
					module="sharing"
					hideButton
				>
					<SettingsGroup
						disableInOfflineMode
						module={ { module: 'sharedaddy' } }
						support={ {
							text: __(
								'You can customize the sharing buttons and choose which services to display.',
								'jetpack'
							),
							link: shouldShowSharingBlock ? sharingBlockSupporUrl : sharingModuleSupportUrl,
						} }
					>
						<p>
							{ __(
								'Add sharing buttons so visitors can share your posts and pages on social media with a couple of quick clicks.',
								'jetpack'
							) }
						</p>
						{ moduleToggle() }
					</SettingsGroup>

					{ ( isActive || shouldShowSharingBlock ) && configCard() }
				</SettingsCard>
			);
		}
	}
);
