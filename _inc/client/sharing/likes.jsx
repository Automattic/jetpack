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
			const { isUnavailableInDevMode, getOptionValue } = this.props;
			const postLikesUnavailable = isUnavailableInDevMode( 'likes' );
			const postLikesActive = getOptionValue( 'likes' );

			const commentLikesUnavailable = isUnavailableInDevMode( 'comment-likes' );
			const commentLikesActive = getOptionValue( 'comment-likes' );

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Like buttons', { context: 'Settings header' } ) }
					module="likes"
					hideButton>
					<SettingsGroup disableInDevMode module={ { module: 'likes' } } support="https://jetpack.com/support/likes/">
						<ModuleToggle
							slug="likes"
							disabled={ postLikesUnavailable }
							activated={ postLikesActive }
							toggling={ this.props.isSavingAnyOption( 'likes' ) }
							toggleModule={ this.props.toggleModuleNow }>
							{ __( 'Add a like button to your posts' ) }
						</ModuleToggle>
						<ModuleToggle
							slug="comment-likes"
							disabled={ commentLikesUnavailable }
							activated={ commentLikesActive }
							toggling={ this.props.isSavingAnyOption( 'comment-likes' ) }
							toggleModule={ this.props.toggleModuleNow }>
							{ __( 'Add a like button to your post comments' ) }
						</ModuleToggle>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	}
);
