import { getRedirectUrl } from '@automattic/jetpack-components';
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { __, _x } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { Component } from 'react';
// The following imports are Redux-connected / state-aware composed helpers shared across
// Jetpack settings (form helpers HOC, module toggle with analytics + override logic,
// settings card with plan/upsell wiring, settings group with offline/site-connection
// fades, and the block-theme suggestion notice). They are not simple UI primitives and
// have no 1:1 equivalents in @wordpress/ui or @wordpress/components, so per the
// refactor exception they are left in place.
import BlockThemeNotice from 'components/block-theme-notice';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';

export const ShareButtons = withModuleSettingsFormHelpers(
	class extends Component {
		trackClickConfigure() {
			analytics.tracks.recordJetpackClick( {
				target: 'configure-sharing',
				page: 'sharing',
				platform: isWpcomPlatformSite() ? 'wpcom' : 'jetpack',
			} );
		}

		render() {
			const siteAdminUrl = this.props.siteAdminUrl,
				hasSharingBlock = this.props.hasSharingBlock,
				isBlockTheme = this.props.isBlockTheme,
				isActive = this.props.getOptionValue( 'sharedaddy' );

			const shouldShowSharingBlock = isBlockTheme && hasSharingBlock;

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
			 * @return {import('react').ReactNode} A card with the sharing configuration link.
			 */
			const configCard = () => {
				const linkProps = {
					className: 'jp-settings-card__configure-link',
					href: `${ siteAdminUrl }options-general.php?page=sharing`,
					onClick: this.trackClickConfigure,
					tone: 'neutral',
					variant: 'default',
				};

				if ( shouldShowSharingBlock ) {
					linkProps.href = `${ siteAdminUrl }site-editor.php?path=%2Fwp_template`;
				}

				return <Link { ...linkProps }>{ __( 'Configure your sharing buttons', 'jetpack' ) }</Link>;
			};

			/**
			 * Sharing module toggle, and suggestion to use the sharing block.
			 *
			 * If the sharing block is available,
			 * we suggest to use it instead of the legacy module.
			 *
			 * @return {import('react').ReactNode} A module toggle.
			 */
			const moduleToggle = () => {
				const toggle = (
					<ModuleToggle
						slug="sharedaddy"
						activated={ isActive }
						toggling={ this.props.isSavingAnyOption( 'sharedaddy' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{ __( 'Add sharing buttons to your posts and pages', 'jetpack' ) }
						</span>
					</ModuleToggle>
				);

				// If the sharing block is not available,
				// only display the legacy module toggle.
				if ( ! shouldShowSharingBlock ) {
					return toggle;
				}

				// If the sharing block is available,
				// Let's suggest the sharing block as an alternative.
				return (
					<>
						{ toggle }
						<BlockThemeNotice
							isModuleActive={ isActive }
							redirectSlug="jetpack-support-sharing-block"
						/>
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
							link: shouldShowSharingBlock
								? getRedirectUrl( 'jetpack-support-sharing-block' )
								: sharingModuleSupportUrl,
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
