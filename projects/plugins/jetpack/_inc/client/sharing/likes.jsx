import { getRedirectUrl } from '@automattic/jetpack-components';
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { __, _x } from '@wordpress/i18n';
import { Component } from 'react';
import Button from 'components/button';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';

export const Likes = withModuleSettingsFormHelpers(
	class extends Component {
		trackClickConfigure() {
			analytics.tracks.recordJetpackClick( {
				target: 'configure-like-block',
				page: 'sharing',
				platform: isWpcomPlatformSite() ? 'wpcom' : 'jetpack',
			} );
		}

		switchToLikeBlock = () => {
			analytics.tracks.recordEvent( 'jetpack_wpa_module_toggle', {
				module: 'likes',
				toggled: 'off',
			} );

			this.props.updateOptions(
				{ likes: false },
				{
					progress: __( 'Deactivating legacy Like buttons…', 'jetpack' ),
					success: __( 'Like buttons have been deactivated.', 'jetpack' ),
				}
			);
		};

		render() {
			const unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'likes' ),
				siteAdminUrl = this.props.siteAdminUrl,
				hasLikeBlock = this.props.hasLikeBlock,
				isBlockTheme = this.props.isBlockTheme,
				isActive = this.props.getOptionValue( 'likes' );

			const shouldShowLikeBlock = isBlockTheme && hasLikeBlock;
			const likeTemplateUrl =
				siteAdminUrl && this.props.themeStylesheet
					? `${ siteAdminUrl }site-editor.php?p=%2Fwp_template%2F${ encodeURIComponent(
							this.props.themeStylesheet
					  ) }%2F%2Fsingle&canvas=edit`
					: '';
			const shouldUseLikeBlockAction = shouldShowLikeBlock && likeTemplateUrl;
			const isForcedActive = isActive && this.props.getModule?.( 'likes' )?.override === 'active';
			let description = __(
				'The Like button is a way for people on WordPress.com to show their appreciation for your content.',
				'jetpack'
			);
			if ( shouldUseLikeBlockAction ) {
				description = isActive
					? __( 'Legacy Like buttons cannot be customized on block themes.', 'jetpack' )
					: _x(
							'Add the Like block to your theme’s template.',
							'Like block migration instruction',
							'jetpack'
					  );
			}

			/**
			 * Use the legacy toggle where needed; otherwise guide block themes through
			 * deactivating legacy likes before configuring the Like block.
			 *
			 * @return {import('react').ReactNode} The likes module action.
			 */
			const moduleAction = () => {
				const toggle = (
					<ModuleToggle
						slug="likes"
						disabled={
							isForcedActive || unavailableInOfflineMode || this.props.isSavingAnyOption( 'likes' )
						}
						activated={ isActive }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{ __( 'Add Like buttons to your posts and pages', 'jetpack' ) }
						</span>
					</ModuleToggle>
				);

				if ( ! shouldUseLikeBlockAction ) {
					return toggle;
				}

				if ( isForcedActive ) {
					return toggle;
				}

				if ( isActive ) {
					const isSwitching = this.props.isSavingAnyOption( 'likes' );

					return (
						<Button rna compact disabled={ isSwitching } onClick={ this.switchToLikeBlock }>
							{ isSwitching
								? _x( 'Switching…', 'Button caption', 'jetpack' )
								: __( 'Switch to the Like block', 'jetpack' ) }
						</Button>
					);
				}

				return (
					<Button rna compact href={ likeTemplateUrl } onClick={ this.trackClickConfigure }>
						{ __( 'Open Site Editor', 'jetpack' ) }
					</Button>
				);
			};

			return (
				<SettingsCard
					{ ...this.props }
					header={ _x( 'Like buttons', 'Settings header', 'jetpack' ) }
					module="likes"
					hideButton
				>
					<SettingsGroup
						disableInOfflineMode
						module={ { module: 'likes' } }
						support={ {
							text: __(
								'Adds like buttons to your content so that visitors can show their appreciation or enjoyment.',
								'jetpack'
							),
							link: shouldShowLikeBlock
								? getRedirectUrl( 'jetpack-support-like-block' )
								: getRedirectUrl( 'jetpack-support-likes' ),
						} }
					>
						<p>{ description }</p>
						{ moduleAction() }
					</SettingsGroup>
				</SettingsCard>
			);
		}
	}
);
