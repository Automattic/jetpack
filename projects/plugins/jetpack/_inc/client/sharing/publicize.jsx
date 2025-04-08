import { getRedirectUrl } from '@automattic/jetpack-components';
import { getAdminUrl } from '@automattic/jetpack-script-data';
import { __, _x } from '@wordpress/i18n';
import { Component } from 'react';
import Card from 'components/card';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import { FEATURE_JETPACK_SOCIAL } from '../lib/plans/constants';

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

		render() {
			const isActive = this.props.getOptionValue( 'publicize' ),
				userCanManageModules = this.props.userCanManageModules;

			if ( ! userCanManageModules && ! isActive ) {
				return null;
			}

			const isLinked = this.props.isLinked,
				isOfflineMode = this.props.isOfflineMode;

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
					</SettingsGroup>
					{ isActive && (
						<Card
							compact
							onClick={ this.trackClickConfigure }
							href={ getAdminUrl( 'admin.php?page=jetpack-social' ) }
						>
							{ __( 'Connect accounts and configure Social sharing', 'jetpack' ) }
						</Card>
					) }
				</SettingsCard>
			);
		}
	}
);
