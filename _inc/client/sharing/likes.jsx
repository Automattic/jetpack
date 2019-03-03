/**
 * External dependencies
 */
import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';

export const Likes = withModuleSettingsFormHelpers(
	class extends Component {
		render() {
			const unavailableInDevMode = this.props.isUnavailableInDevMode( 'likes' );
			const isActive = this.props.getOptionValue( 'likes' );

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Like buttons', { context: 'Settings header' } ) }
					module="likes"
					hideButton
				>
					<SettingsGroup
						disableInDevMode
						module={ { module: 'likes' } }
						support={ {
							text: __(
								'Adds like buttons to your content so that visitors can show their appreciation or enjoyment.'
							),
							link: 'https://jetpack.com/support/likes/',
						} }
					>
						<p>{ __( 'When visitors enjoy your content, let them show it with a Like.' ) }</p>
						<ModuleToggle
							slug="likes"
							disabled={ unavailableInDevMode }
							activated={ isActive }
							toggling={ this.props.isSavingAnyOption( 'likes' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							{ __( 'Add Like buttons to your posts and pages' ) }
						</ModuleToggle>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	}
);
