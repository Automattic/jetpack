/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import TextInput from 'components/text-input';

/**
 * Internal dependencies
 */
import {
	FormFieldset,
	FormLabel,
	FormSelect
} from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

class CommentsComponent extends React.Component {
    /**
	 * If markdown module is inactive and this is toggling markdown for comments on, activate module.
	 * If markdown for posts is off and this is toggling markdown for comments off, deactivate module.
	 *
	 * @param {string} module
	 * @returns {*}
	 */
	updateFormStateByMarkdown = module => {
		if ( !! this.props.getSettingCurrentValue( 'wpcom_publish_posts_with_markdown', module ) ) {
			return this.props.updateFormStateModuleOption( module, 'wpcom_publish_comments_with_markdown' );
		}
		return this.props.updateFormStateModuleOption( module, 'wpcom_publish_comments_with_markdown', true );
	};

	render() {
		const foundComments = this.props.isModuleFound( 'comments' ),
			foundGravatar = this.props.isModuleFound( 'gravatar-hovercards' ),
			foundMarkdown = this.props.isModuleFound( 'markdown' ),
			foundCommentLikes = this.props.isModuleFound( 'comment-likes' );

		if ( ! foundComments && ! foundGravatar && ! foundMarkdown && ! foundCommentLikes ) {
			return null;
		}

		const { isUnavailableInDevMode, getOptionValue } = this.props;

		const comments = this.props.getModule( 'comments' ),
			isCommentsActive = this.props.getOptionValue( 'comments' ),
			commentsUnavailableInDevMode = this.props.isUnavailableInDevMode( 'comments' ),
			gravatar = this.props.getModule( 'gravatar-hovercards' ),
			markdown = this.props.getModule( 'markdown' ),
			commentLikesUnavailable = isUnavailableInDevMode( 'comment-likes' ),
			commentLikesActive = getOptionValue( 'comment-likes' );

		return (
			<SettingsCard
				{ ...this.props }
				header={ __( 'Comments' ) }
				module="comments"
				saveDisabled={ this.props.isSavingAnyOption( [ 'highlander_comment_form_prompt', 'jetpack_comment_form_color_scheme' ] ) }
			>
				{
					foundComments && (
						<SettingsGroup hasChild disableInDevMode module={ comments }>
							<ModuleToggle
								slug="comments"
								compact
								disabled={ commentsUnavailableInDevMode }
								activated={ this.props.getOptionValue( 'comments' ) }
								toggling={ this.props.isSavingAnyOption( 'comments' ) }
								toggleModule={ this.props.toggleModuleNow }
							>
					<span className="jp-form-toggle-explanation">
						{
							comments.description
						}
					</span>
							</ModuleToggle>
							<FormFieldset>
								<FormLabel>
									<span className="jp-form-label-wide">{ __( 'Comments headline' ) }</span>
									<TextInput
										name={ 'highlander_comment_form_prompt' }
										value={ this.props.getOptionValue( 'highlander_comment_form_prompt' ) }
										disabled={ ! isCommentsActive || commentsUnavailableInDevMode || this.props.isSavingAnyOption( 'highlander_comment_form_prompt' ) }
										onChange={ this.props.onOptionChange } />
								</FormLabel>
								<span className="jp-form-setting-explanation">{ __( 'A few catchy words to motivate your readers to comment.' ) }</span>
								<FormLabel>
									<span className="jp-form-label-wide">{ __( 'Color scheme' ) }</span>
									<FormSelect
										name={ 'jetpack_comment_form_color_scheme' }
										value={ this.props.getOptionValue( 'jetpack_comment_form_color_scheme' ) }
										disabled={ ! isCommentsActive || commentsUnavailableInDevMode || this.props.isSavingAnyOption( 'jetpack_comment_form_color_scheme' ) }
										onChange={ this.props.onOptionChange }
										{ ...this.props }
										validValues={ this.props.validValues( 'jetpack_comment_form_color_scheme', 'comments' ) } />
								</FormLabel>
							</FormFieldset>
						</SettingsGroup>
					)
				}
				{
					( foundGravatar || foundMarkdown || foundCommentLikes ) && (
						<SettingsGroup>
							{
								foundGravatar && (
									<FormFieldset>
										<ModuleToggle
											slug="gravatar-hovercards"
											compact
											activated={ this.props.getOptionValue( 'gravatar-hovercards' ) }
											toggling={ this.props.isSavingAnyOption( 'gravatar-hovercards' ) }
											toggleModule={ this.props.toggleModuleNow }
										>
											<span className="jp-form-toggle-explanation">
												{
													gravatar.description + ' '
												}
												<a href={ gravatar.learn_more_button } target="_blank" rel="noopener noreferrer">
													{ __( 'Learn more' ) }
												</a>
											</span>
										</ModuleToggle>
									</FormFieldset>
								)
							}
							{
								foundMarkdown && (
									<FormFieldset>
										<ModuleToggle
											slug="markdown"
											compact
											activated={ !! this.props.getOptionValue( 'wpcom_publish_comments_with_markdown', 'markdown' ) }
											toggling={ this.props.isSavingAnyOption( [ 'markdown', 'wpcom_publish_comments_with_markdown' ] ) }
											toggleModule={ this.updateFormStateByMarkdown }
										>
											<span className="jp-form-toggle-explanation">
												{
													__( 'Enable Markdown use for comments.' ) + ' '
												}
												<a href={ markdown.learn_more_button } target="_blank" rel="noopener noreferrer">
													{ __( 'Learn more' ) }
												</a>
											</span>
										</ModuleToggle>
									</FormFieldset>
								)
							}
							{
								foundCommentLikes && (
									<FormFieldset>
										<ModuleToggle
											slug="comment-likes"
											compact
											disabled={ commentLikesUnavailable }
											activated={ commentLikesActive }
											toggling={ this.props.isSavingAnyOption( 'comment-likes' ) }
											toggleModule={ this.props.toggleModuleNow }
										>
											<span className="jp-form-toggle-explanation">
												{
													( 'Enable comment likes.' ) + ' '
												}
												<a href="https://jetpack.com/support/comment-likes/" target="_blank" rel="noopener noreferrer">
													{ __( 'Learn more' ) }
												</a>
											</span>
										</ModuleToggle>
									</FormFieldset>
								)
							}
						</SettingsGroup>
					)
				}
			</SettingsCard>
		);
	}
}

export const Comments = moduleSettingsForm( CommentsComponent );
