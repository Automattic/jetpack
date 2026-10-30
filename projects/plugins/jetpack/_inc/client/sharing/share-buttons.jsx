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
			const isForcedActive =
				isActive && this.props.getModule?.( 'sharedaddy' )?.override === 'active';
			let description = __(
				'Add sharing buttons so visitors can share your posts and pages on social media with a couple of quick clicks.',
				'jetpack'
			);
			if ( shouldShowSharingBlock ) {
				description = isActive
					? __( 'Legacy sharing buttons cannot be customized on block themes.', 'jetpack' )
					: _x(
							'Choose where the Sharing Buttons block goes on your posts and pages.',
							'Sharing block migration instruction',
							'jetpack'
						);
			}

			const sharingModuleSupportUrl = getRedirectUrl( 'jetpack-support-sharing' );

			// Settings > Sharing configures legacy sharing while it is on, and the block's placement once it is off.
			const showConfigCard = shouldShowSharingBlock ? ! isActive : isActive;

			/**
			 * Use the legacy toggle where needed; otherwise offer block themes the switch to the Sharing Buttons block.
			 *
			 * @return {import('react').ReactNode} The sharing module action, if any.
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

				if ( ! shouldShowSharingBlock || isForcedActive ) {
					return toggle;
				}

				if ( ! isActive ) {
					return null;
				}

				const isSwitching = this.props.isSavingAnyOption( 'sharedaddy' );

				return (
					<Button rna compact disabled={ isSwitching } onClick={ this.switchToSharingBlock }>
						{ isSwitching
							? _x( 'Switching…', 'Button caption', 'jetpack' )
							: __( 'Switch to Sharing Buttons block', 'jetpack' ) }
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
							wpcomLink: 'https://wordpress.com/support/sharing/',
						} }
					>
						<p>{ description }</p>
						{ moduleAction() }
					</SettingsGroup>

					{ showConfigCard && (
						<Card
							compact
							className="jp-settings-card__configure-link"
							href={ `${ siteAdminUrl }options-general.php?page=sharing` }
							onClick={ this.trackClickConfigure }
						>
							{ __( 'Configure your sharing buttons', 'jetpack' ) }
						</Card>
					) }
				</SettingsCard>
			);
		}
	}
);
