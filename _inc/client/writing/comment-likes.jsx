/**
 * External dependencies
 */
import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';

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
			const isActive = this.props.getOptionValue( 'comment-likes' ),
				unavailableInDevMode = this.props.isUnavailableInDevMode( 'comment-likes' ),
				isLinked = this.props.isLinked;

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Comment Likes', { context: 'Settings header' } ) }
					module="comment-likes"
					hideButton>
					<SettingsGroup disableInDevMode module={ { module: 'comment-likes' } } support="https://jetpack.com/support/masterbar/">
						<ModuleToggle
							slug="comment-likes"
							disabled={ unavailableInDevMode || ! isLinked }
							activated={ isActive }
							toggling={ this.props.isSavingAnyOption( 'comment-likes' ) }
							toggleModule={ this.props.toggleModuleNow }>
							{ __( 'Enable Comment Likes' ) }
							<span className="jp-form-setting-explanation">
							{
								__( 'Comment Likes are super awesome.' )
							}
						</span>
						</ModuleToggle>
					</SettingsGroup>
					{
						( ! this.props.isUnavailableInDevMode( 'comment-likes' ) && ! this.props.isLinked ) && (
							<Card
								compact
								className="jp-settings-card__configure-link"
								href={ `${ this.props.connectUrl }&from=unlinked-user-connect-comment-likes` }
							>
								{
									__( 'Connect your user account to WordPress.com to use this feature' )
								}
							</Card>
						)
					}
				</SettingsCard>
			);
		}
	}
);
