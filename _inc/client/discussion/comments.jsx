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

export const Comments = moduleSettingsForm(
	React.createClass( {

		render() {
			let comments = this.props.getModule( 'comments' ),
				isCommentsActive = this.props.getOptionValue( 'comments' ),
				commentsUnavailableInDevMode = this.props.isUnavailableInDevMode( 'comments' ),
				gravatar = this.props.getModule( 'gravatar-hovercards' ),
				markdown = this.props.getModule( 'markdown' );
			return (
				<SettingsCard
					{ ...this.props }
					module="comments">
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
									disabled={ ! isCommentsActive || commentsUnavailableInDevMode || this.props.isUpdating( 'highlander_comment_form_prompt' ) }
									onChange={ this.props.onOptionChange } />
							</FormLabel>
							<span className="jp-form-setting-explanation">{ __( 'A few catchy words to motivate your readers to comment.' ) }</span>
							<FormLabel>
								<span className="jp-form-label-wide">{ __( 'Color Scheme' ) }</span>
								<FormSelect
									name={ 'jetpack_comment_form_color_scheme' }
									value={ this.props.getOptionValue( 'jetpack_comment_form_color_scheme' ) }
									disabled={ ! isCommentsActive || commentsUnavailableInDevMode }
									onChange={ this.props.onOptionChange }
									{ ...this.props }
									validValues={ this.props.validValues( 'jetpack_comment_form_color_scheme', 'comments' ) }/>
							</FormLabel>
						</FormFieldset>
					</SettingsGroup>
					<SettingsGroup>
						<FormFieldset support={ gravatar.learn_more_button }>
							<ModuleToggle
								slug="gravatar-hovercards"
								compact
								activated={ this.props.getOptionValue( 'gravatar-hovercards' ) }
								toggling={ this.props.isSavingAnyOption( 'gravatar-hovercards' ) }
								toggleModule={ this.props.toggleModuleNow }
							>
							<span className="jp-form-toggle-explanation">
								{
									gravatar.description
								}
							</span>
							</ModuleToggle>
						</FormFieldset>
						<FormFieldset support={ markdown.learn_more_button }>
							<ModuleToggle
								slug="markdown"
								compact
								activated={ !!this.props.getOptionValue( 'wpcom_publish_comments_with_markdown', 'markdown' ) }
								toggling={ this.props.isSavingAnyOption( [ 'markdown', 'wpcom_publish_comments_with_markdown' ] ) }
								toggleModule={ m => this.props.updateFormStateModuleOption( m, 'wpcom_publish_comments_with_markdown' ) }
							>
							<span className="jp-form-toggle-explanation">
								{
									__( 'Enable Markdown use for comments' )
								}
							</span>
							</ModuleToggle>
						</FormFieldset>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);
