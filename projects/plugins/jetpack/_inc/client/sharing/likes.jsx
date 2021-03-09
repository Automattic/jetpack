/**
 * External dependencies
 */
import React, { Component } from 'react';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import getRedirectUrl from 'lib/jp-redirect';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';

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
								'When WordPress.com users enjoy your content, let them show it with a Like.',
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
