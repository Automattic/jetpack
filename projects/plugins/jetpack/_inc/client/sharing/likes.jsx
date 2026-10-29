import { getRedirectUrl } from '@automattic/jetpack-components';
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { __, _x } from '@wordpress/i18n';
import { Component } from 'react';
import Button from 'components/button';
import Card from 'components/card';
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
			const isForcedActive = isActive && this.props.getModule?.( 'likes' )?.override === 'active';
			let description = __(
				'The Like button is a way for people on WordPress.com to show their appreciation for your content.',
				'jetpack'
			);
			if ( shouldShowLikeBlock ) {
				description = isActive
					? __( 'Legacy Like buttons cannot be customized on block themes.', 'jetpack' )
					: _x(
							'Choose where the Like block goes on your posts and pages.',
							'Like block migration instruction',
							'jetpack'
						);
			}

			/**
			 * Use the legacy toggle where needed; otherwise offer block themes the switch to the Like block.
			 *
			 * @return {import('react').ReactNode} The likes module action, if any.
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

				if ( ! shouldShowLikeBlock || isForcedActive ) {
					return toggle;
				}

				if ( ! isActive ) {
					return null;
				}

				const isSwitching = this.props.isSavingAnyOption( 'likes' );

				return (
					<Button rna compact disabled={ isSwitching } onClick={ this.switchToLikeBlock }>
						{ isSwitching
							? _x( 'Switching…', 'Button caption', 'jetpack' )
							: __( 'Switch to the Like block', 'jetpack' ) }
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
							wpcomLink: 'https://wordpress.com/support/likes/',
						} }
					>
						<p>{ description }</p>
						{ moduleAction() }
					</SettingsGroup>

					{ shouldShowLikeBlock && ! isActive && ! unavailableInOfflineMode && (
						<Card
							compact
							className="jp-settings-card__configure-link"
							href={ `${ siteAdminUrl }options-general.php?page=sharing#likes` }
							onClick={ this.trackClickConfigure }
						>
							{ __( 'Configure your Like buttons', 'jetpack' ) }
						</Card>
					) }
				</SettingsCard>
			);
		}
	}
);
