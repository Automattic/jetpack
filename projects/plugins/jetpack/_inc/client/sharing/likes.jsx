import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import React, { Component } from 'react';

export const Likes = withModuleSettingsFormHelpers(
	class extends Component {
		render() {
			const unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'likes' );
			const isActive = this.props.getOptionValue( 'likes' );

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
							disabled={ unavailableInOfflineMode }
							activated={ isActive }
							toggling={ this.props.isSavingAnyOption( 'likes' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							{ __( 'Add Like buttons to your posts and pages', 'jetpack' ) }
						</ModuleToggle>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	}
);
