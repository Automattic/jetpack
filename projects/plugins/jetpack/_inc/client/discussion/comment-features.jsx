import { getRedirectUrl } from '@automattic/jetpack-components';
import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Component } from 'react';
import { FormFieldset } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import SupportInfo from 'components/support-info';

class CommentFeaturesComponent extends Component {
	handleMarkdownCommentsToggle = () => {
		this.props.updateFormStateModuleOption( 'markdown', 'wpcom_publish_comments_with_markdown' );
	};

	render() {
		const foundGravatar = this.props.isModuleFound( 'gravatar-hovercards' ),
			foundMarkdown = this.props.isModuleFound( 'markdown' ),
			foundCommentLikes = this.props.isModuleFound( 'comment-likes' );

		if ( ! foundGravatar && ! foundMarkdown && ! foundCommentLikes ) {
			return null;
		}

		const { isUnavailableInOfflineMode, getOptionValue } = this.props;

		const gravatar = this.props.getModule( 'gravatar-hovercards' ),
			markdown = this.props.getModule( 'markdown' ),
			commentLikesUnavailable = isUnavailableInOfflineMode( 'comment-likes' ),
			commentLikesActive = getOptionValue( 'comment-likes' );

		// Every toggle here saves as it changes, and none needs the Comments module.
		return (
			<SettingsCard { ...this.props } header={ __( 'Comment features', 'jetpack' ) } hideButton>
				<SettingsGroup>
					{ foundGravatar && (
						<div className="jp-toggle-set">
							<FormFieldset>
								<ModuleToggle
									slug="gravatar-hovercards"
									compact
									disabled={ this.props.isSavingAnyOption( 'gravatar-hovercards' ) }
									activated={ this.props.getOptionValue( 'gravatar-hovercards' ) }
									toggleModule={ this.props.toggleModuleNow }
								>
									<span className="jp-form-toggle-explanation">{ gravatar.description }</span>
								</ModuleToggle>
							</FormFieldset>
							<SupportInfo
								text={ __( 'Show Gravatar hovercards alongside comments.', 'jetpack' ) }
								link={ gravatar.learn_more_button }
								privacyLink={ gravatar.learn_more_button + '#privacy' }
								wpcomLink="https://wordpress.com/support/gravatars/"
							/>
						</div>
					) }
					{ foundMarkdown && (
						<div className="jp-toggle-set">
							<FormFieldset>
								<ToggleControl
									checked={
										!! this.props.getOptionValue(
											'wpcom_publish_comments_with_markdown',
											'markdown'
										)
									}
									disabled={
										this.props.isSavingAnyOption( [ 'markdown' ] ) ||
										'inactive' === this.props.getModuleOverride( 'markdown' )
									}
									onChange={ this.handleMarkdownCommentsToggle }
									label={
										<span className="jp-form-toggle-explanation">
											{ __( 'Enable Markdown use for comments.', 'jetpack' ) }
										</span>
									}
									__nextHasNoMarginBottom={ true }
								/>
							</FormFieldset>
							<SupportInfo
								text={ __( 'Allow readers to use markdown in comments.', 'jetpack' ) }
								link={ markdown.learn_more_button }
								privacyLink={ markdown.learn_more_button + '#privacy' }
								wpcomLink="https://wordpress.com/support/wordpress-editor/blocks/markdown-block/"
							/>
						</div>
					) }
					{ foundCommentLikes && (
						<div className="jp-toggle-set">
							<FormFieldset>
								<ModuleToggle
									slug="comment-likes"
									compact
									disabled={
										commentLikesUnavailable || this.props.isSavingAnyOption( 'comment-likes' )
									}
									activated={ commentLikesActive }
									toggleModule={ this.props.toggleModuleNow }
								>
									<span className="jp-form-toggle-explanation">
										{ __( 'Enable comment Likes.', 'jetpack' ) }
									</span>
								</ModuleToggle>
							</FormFieldset>
							<SupportInfo
								text={ __( 'Allow readers to like individual comments.', 'jetpack' ) }
								link={ getRedirectUrl( 'jetpack-support-comment-likes' ) }
								privacyLink={ getRedirectUrl( 'jetpack-support-comment-likes', {
									anchor: 'privacy',
								} ) }
								wpcomLink="https://wordpress.com/support/comment-likes/"
							/>
						</div>
					) }
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

export const CommentFeatures = withModuleSettingsFormHelpers( CommentFeaturesComponent );
