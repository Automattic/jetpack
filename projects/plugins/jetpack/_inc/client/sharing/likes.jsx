import { getRedirectUrl } from '@automattic/jetpack-components';
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { __, _x } from '@wordpress/i18n';
import { Component } from 'react';
import BlockThemeNotice from 'components/block-theme-notice';
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

		render() {
			const unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'likes' );
			const siteAdminUrl = this.props.siteAdminUrl;
			const isActive = this.props.getOptionValue( 'likes' );
			const isBlockTheme = this.props.isBlockTheme;
			const hasLikeBlock = this.props.hasLikeBlock;
			const shouldShowLikeBlock = isBlockTheme && hasLikeBlock;

			/**
			 * Like block configuration link.
			 *
			 * This link is shown when a block theme is active and the like block is available.
			 * It links to the site editor where users can add the like block to their templates.
			 *
			 * @return {import('react').ReactNode} A card with the like block configuration link.
			 */
			const configCard = () => {
				return (
					<Card
						compact
						className="jp-settings-card__configure-link"
						href={ `${ siteAdminUrl }site-editor.php?path=%2Fwp_template` }
						onClick={ this.trackClickConfigure }
					>
						{ __( 'Configure your Like buttons', 'jetpack' ) }
					</Card>
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
							link: getRedirectUrl( 'jetpack-support-likes' ),
						} }
					>
						<p>
							{ __(
								'The Like button is a way for people on WordPress.com to show their appreciation for your content.',
								'jetpack'
							) }
						</p>
						<ModuleToggle
							slug="likes"
							disabled={ unavailableInOfflineMode || this.props.isSavingAnyOption( 'likes' ) }
							activated={ isActive }
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">
								{ __( 'Add Like buttons to your posts and pages', 'jetpack' ) }
							</span>
						</ModuleToggle>
						{ shouldShowLikeBlock && (
							<BlockThemeNotice
								isModuleActive={ isActive }
								redirectSlug="jetpack-support-like-block"
							/>
						) }
					</SettingsGroup>

					{ shouldShowLikeBlock && configCard() }
				</SettingsCard>
			);
		}
	}
);
