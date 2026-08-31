import { getRedirectUrl } from '@automattic/jetpack-components';
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { __, _x } from '@wordpress/i18n';
import { Component } from 'react';
import BlockThemeNotice from 'components/block-theme-notice';
import Button from 'components/button';
import Card from 'components/card';
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

		switchToSharingBlock = () => {
			analytics.tracks.recordEvent( 'jetpack_wpa_module_toggle', {
				module: 'sharedaddy',
				toggled: 'off',
			} );

			this.props.updateOptions(
				{ sharedaddy: false },
				{
					progress: __( 'Deactivating legacy sharing…', 'jetpack' ),
					success: __( 'Sharing has been deactivated.', 'jetpack' ),
				}
			);
		};

		render() {
			const siteAdminUrl = this.props.siteAdminUrl,
				hasSharingBlock = this.props.hasSharingBlock,
				isBlockTheme = this.props.isBlockTheme,
				isActive = this.props.getOptionValue( 'sharedaddy' );

			const shouldShowSharingBlock = isBlockTheme && hasSharingBlock;
			const sharingTemplateUrl =
				siteAdminUrl && this.props.themeStylesheet
					? `${ siteAdminUrl }site-editor.php?p=%2Fwp_template%2F${ encodeURIComponent(
							this.props.themeStylesheet
					  ) }%2F%2Fsingle&canvas=edit`
					: '';
			const shouldUseSharingBlockAction = shouldShowSharingBlock && sharingTemplateUrl;
			const isForcedActive =
				isActive && this.props.getModule?.( 'sharedaddy' )?.override === 'active';
			let description = __(
				'Add sharing buttons so visitors can share your posts and pages on social media with a couple of quick clicks.',
				'jetpack'
			);
			if ( shouldUseSharingBlockAction ) {
				description = isActive
					? __( 'Legacy sharing buttons cannot be customized on block themes.', 'jetpack' )
					: _x(
							'Add the Sharing Buttons block to your theme’s template.',
							'Sharing block migration instruction',
							'jetpack'
					  );
			}

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
				const cardProps = {
					compact: true,
					className: 'jp-settings-card__configure-link',
					href: `${ siteAdminUrl }options-general.php?page=sharing`,
					onClick: this.trackClickConfigure,
				};

				if ( shouldShowSharingBlock ) {
					cardProps.href = `${ siteAdminUrl }site-editor.php?path=%2Fwp_template`;
				}

				return <Card { ...cardProps }>{ __( 'Configure your sharing buttons', 'jetpack' ) }</Card>;
			};

			/**
			 * Use the legacy toggle where needed; otherwise guide block themes through
			 * deactivating legacy sharing before configuring the Sharing Buttons block.
			 *
			 * @return {import('react').ReactNode} The sharing module action.
			 */
			const moduleAction = () => {
				const toggle = (
					<ModuleToggle
						slug="sharedaddy"
						disabled={ isForcedActive || this.props.isSavingAnyOption( 'sharedaddy' ) }
						activated={ isActive }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{ __( 'Add sharing buttons to your posts and pages', 'jetpack' ) }
						</span>
					</ModuleToggle>
				);

				if ( ! shouldUseSharingBlockAction ) {
					return (
						<>
							{ toggle }
							{ shouldShowSharingBlock && (
								<BlockThemeNotice
									isModuleActive={ isActive }
									redirectSlug="jetpack-support-sharing-block"
								/>
							) }
						</>
					);
				}

				if ( isForcedActive ) {
					return toggle;
				}

				if ( isActive ) {
					const isSwitching = this.props.isSavingAnyOption( 'sharedaddy' );

					return (
						<Button rna compact disabled={ isSwitching } onClick={ this.switchToSharingBlock }>
							{ isSwitching
								? _x( 'Switching…', 'Button caption', 'jetpack' )
								: __( 'Switch to Sharing Buttons block', 'jetpack' ) }
						</Button>
					);
				}

				return (
					<Button rna compact href={ sharingTemplateUrl } onClick={ this.trackClickConfigure }>
						{ __( 'Open Site Editor', 'jetpack' ) }
					</Button>
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
						<p>{ description }</p>
						{ moduleAction() }
					</SettingsGroup>

					{ ( isActive || shouldShowSharingBlock ) &&
						! shouldUseSharingBlockAction &&
						configCard() }
				</SettingsCard>
			);
		}
	}
);
