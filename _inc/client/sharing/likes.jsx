/**
 * External dependencies
 */
import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';

export const Likes = moduleSettingsForm(
	class extends Component {
		render() {
			const unavailableInDevMode = this.props.isUnavailableInDevMode( 'likes' ),
				isActive = this.props.getOptionValue( 'likes' );

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Like buttons', { context: 'Settings header' } ) }
					module="likes"
					hideButton>
					<SettingsGroup disableInDevMode module={ { module: 'likes' } } support="https://jetpack.com/support/likes/">
						<ModuleToggle
							slug="likes"
							disabled={ unavailableInDevMode }
							activated={ isActive }
							toggling={ this.props.isSavingAnyOption( 'likes' ) }
							toggleModule={ this.props.toggleModuleNow }>
							{ __( 'Allow readers to show their appreciation of your posts by adding a like button to your content' ) }
						</ModuleToggle>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	}
);
