import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import Card from 'components/card';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
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

		disableSharingModule = () => {
			analytics.tracks.recordJetpackClick( {
				target: 'disable-sharing-module',
				page: 'sharing',
			} );
			this.props.updateOptions( {
				sharedaddy: false,
			} );
		};

		render() {
			const isLinked = this.props.isLinked,
				siteRawUrl = this.props.siteRawUrl,
				siteAdminUrl = this.props.siteAdminUrl,
				isOfflineMode = this.props.isOfflineMode,
				hasSharingBlock = this.props.hasSharingBlock,
				isBlockTheme = this.props.isBlockTheme,
				isActive = this.props.getOptionValue( 'sharedaddy' );

			const shouldShowSharingBlock = isBlockTheme && hasSharingBlock;

			/**
			 * Sharing configuration link.
			 *
			 * This link can be different depending on your site setup:
			 * - Do you use a block-based theme and is the sharing block available?
			 * - Is the site connected to WordPress.com?
			 * - Is the site in offline mode?
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
				} else if ( isLinked && ! isOfflineMode ) {
					cardProps.href = getRedirectUrl( 'calypso-marketing-sharing-buttons', {
						site: siteRawUrl,
					} );
					cardProps.onClick = this.trackClickConfigure;
					cardProps.target = '_blank';
					cardProps.rel = 'noopener noreferrer';
				}

				return <Card { ...cardProps }>{ __( 'Configure your sharing buttons', 'jetpack' ) }</Card>;
			};

			/**
			 * Sharing module toggle, or suggestion to disable the module.
			 *
			 * If the sharing block is available,
			 * we suggest disabling the legacy module if it is active.
			 *
			 * @returns {React.ReactNode} A module toggle.
			 */
			const moduleToggle = () => {
				// If the sharing block is not available,
				// only display the legacy module toggle.
				if ( ! shouldShowSharingBlock ) {
					return (
						<ModuleToggle
							slug="sharedaddy"
							activated={ isActive }
							toggling={ this.props.isSavingAnyOption( 'sharedaddy' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							{ __( 'Add sharing buttons to your posts and pages', 'jetpack' ) }
						</ModuleToggle>
					);
				}

				// If the sharing block is available and the module is active,
				// Let's suggest disabling the module ; it is not needed anymore.
				if ( isActive ) {
					return (
						<p className="jp-settings-sharing__block-theme-description">
							{ createInterpolateElement(
								__(
									'You are using a block-based theme. You can <a>disable Jetpack’s legacy sharing buttons</a>, and add a sharing buttons block to your themes’s template instead.',
									'jetpack'
								),
								{
									/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
									a: <a className="dops-card__link" onClick={ this.disableSharingModule } />,
								}
							) }
						</p>
					);
				}

				// If the sharing block is available and the module is not active,
				// Do not display any module toggle.
				return;
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
							link: shouldShowSharingBlock
								? getRedirectUrl( 'jetpack-support-sharing-block' )
								: getRedirectUrl( 'jetpack-support-sharing' ),
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
