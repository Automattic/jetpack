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

export const CommentLikes = moduleSettingsForm(
	class extends Component {
		render() {
			const { isUnavailableInDevMode, getOptionValue } = this.props;
			const commentLikesUnavailable = isUnavailableInDevMode( 'comment-likes' );
			const commentLikesActive = getOptionValue( 'comment-likes' );

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Comment like buttons', { context: 'Settings header' } ) }
					module="comment-likes"
					hideButton>
					<SettingsGroup disableInDevMode module={ { module: 'comment-likes' } } support="https://jetpack.com/support/comment-likes/">
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
