// NOTE: @wordpress/ui has form primitives (Field, Fieldset, Input, Select) but
// no ToggleControl. Falling back to @wordpress/components per the priority list
// (ui first, components when ui lacks an equivalent).
import { SelectControl, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Fieldset } from '@wordpress/ui';
import { Component } from 'react';
// NOTE: withModuleSettingsFormHelpers, ModuleToggle, SettingsCard, and
// SettingsGroup are Jetpack business-logic composites (save buttons, upgrade
// upsells, analytics, override handling) — not UI primitives — so they remain
// imported from _inc/client/components per the refactor rules.
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
// NOTE: SupportInfo wraps InfoPopover (preserved helper) and tracks analytics —
// keep the Jetpack helper per the refactor rules.
import SupportInfo from 'components/support-info';
// NOTE: getRedirectUrl is a preserved Jetpack helper (not a UI primitive).
import { getRedirectUrl } from '@automattic/jetpack-components';

import './style.scss';

class CommentsComponent extends Component {
	/**
	 * If markdown module is inactive and this is toggling markdown for comments on, activate module.
	 * If markdown for posts is off and this is toggling markdown for comments off, deactivate module.
	 *
	 * @param {string} module - the module slug.
	 * @return {*}             the updated value
	 */
	updateFormStateByMarkdown = module => {
		if ( this.props.getSettingCurrentValue( 'wpcom_publish_posts_with_markdown', module ) ) {
			return this.props.updateFormStateModuleOption(
				module,
				'wpcom_publish_comments_with_markdown'
			);
		}
		return this.props.updateFormStateModuleOption(
			module,
			'wpcom_publish_comments_with_markdown',
			true
		);
	};

	handleMarkdownCommentsToggle = () => {
		this.props.updateFormStateModuleOption( 'markdown', 'wpcom_publish_comments_with_markdown' );
	};

	handlePromptChange = value => {
		this.props.updateFormStateOptionValue( 'highlander_comment_form_prompt', value );
	};

	handleColorSchemeChange = value => {
		this.props.updateFormStateOptionValue( 'jetpack_comment_form_color_scheme', value );
	};

	render() {
		const foundComments = this.props.isModuleFound( 'comments' ),
			foundGravatar = this.props.isModuleFound( 'gravatar-hovercards' ),
			foundMarkdown = this.props.isModuleFound( 'markdown' ),
			foundCommentLikes = this.props.isModuleFound( 'comment-likes' );

		if ( ! foundComments && ! foundGravatar && ! foundMarkdown && ! foundCommentLikes ) {
			return null;
		}

		const { isUnavailableInOfflineMode: isUnavailableInOfflineMode, getOptionValue } = this.props;

		const comments = this.props.getModule( 'comments' ),
			isCommentsActive = this.props.getOptionValue( 'comments' ),
			commentsUnavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'comments' ),
			gravatar = this.props.getModule( 'gravatar-hovercards' ),
			markdown = this.props.getModule( 'markdown' ),
			commentLikesUnavailable = isUnavailableInOfflineMode( 'comment-likes' ),
			commentLikesActive = getOptionValue( 'comment-likes' );

		const colorSchemeOptions = Object.entries(
			this.props.validValues( 'jetpack_comment_form_color_scheme', 'comments' ) || {}
		).map( ( [ value, label ] ) => ( { value, label } ) );

		const commentsDisabled =
			! isCommentsActive ||
			commentsUnavailableInOfflineMode ||
			this.props.isSavingAnyOption( 'comments' );

		return (
			<SettingsCard
				{ ...this.props }
				header={ __( 'Comments', 'jetpack' ) }
				module="comments"
				saveDisabled={ this.props.isSavingAnyOption( [
					'highlander_comment_form_prompt',
					'jetpack_comment_form_color_scheme',
				] ) }
			>
				{ foundComments && (
					<SettingsGroup
						hasChild
						disableInOfflineMode
						module={ comments }
						support={ {
							text: __(
								'Replaces the standard WordPress comment form with a new comment system that includes social media login options.',
								'jetpack'
							),
							link: getRedirectUrl( 'jetpack-support-comments' ),
						} }
					>
						<ModuleToggle
							slug="comments"
							compact
							disabled={ commentsUnavailableInOfflineMode }
							activated={ this.props.getOptionValue( 'comments' ) }
							toggling={ this.props.isSavingAnyOption( 'comments' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">{ comments.description }</span>
						</ModuleToggle>
						<Fieldset.Root className="jp-form-fieldset">
							<label className="jp-form-label">
								<span className="jp-form-label-wide">
									{ __( 'Comment form introduction', 'jetpack' ) }
								</span>
								<TextControl
									__nextHasNoMarginBottom
									__next40pxDefaultSize
									name="highlander_comment_form_prompt"
									value={
										this.props.getOptionValue( 'highlander_comment_form_prompt' ) || ''
									}
									disabled={
										commentsDisabled ||
										this.props.isSavingAnyOption( 'highlander_comment_form_prompt' )
									}
									onChange={ this.handlePromptChange }
								/>
							</label>
							<span className="jp-form-setting-explanation">
								{ __( 'A few catchy words to motivate your visitors to comment.', 'jetpack' ) }
							</span>
							<label className="jp-form-label">
								<span className="jp-form-label-wide">
									{ __( 'Color scheme', 'jetpack' ) }
								</span>
								<SelectControl
									__nextHasNoMarginBottom
									__next40pxDefaultSize
									name="jetpack_comment_form_color_scheme"
									value={ this.props.getOptionValue( 'jetpack_comment_form_color_scheme' ) }
									options={ colorSchemeOptions }
									disabled={
										commentsDisabled ||
										this.props.isSavingAnyOption( 'jetpack_comment_form_color_scheme' )
									}
									onChange={ this.handleColorSchemeChange }
								/>
							</label>
						</Fieldset.Root>
					</SettingsGroup>
				) }
				{ ( foundGravatar || foundMarkdown || foundCommentLikes ) && (
					<SettingsGroup>
						{ foundGravatar && (
							<div className="jp-toggle-set">
								<Fieldset.Root className="jp-form-fieldset">
									<ModuleToggle
										slug="gravatar-hovercards"
										compact
										activated={ this.props.getOptionValue( 'gravatar-hovercards' ) }
										toggling={ this.props.isSavingAnyOption( 'gravatar-hovercards' ) }
										toggleModule={ this.props.toggleModuleNow }
									>
										<span className="jp-form-toggle-explanation">{ gravatar.description }</span>
									</ModuleToggle>
								</Fieldset.Root>
								<SupportInfo
									text={ __( 'Show Gravatar hovercards alongside comments.', 'jetpack' ) }
									link={ gravatar.learn_more_button }
									privacyLink={ gravatar.learn_more_button + '#privacy' }
								/>
							</div>
						) }
						{ foundMarkdown && (
							<div className="jp-toggle-set">
								<Fieldset.Root className="jp-form-fieldset">
									<ToggleControl
										__nextHasNoMarginBottom
										checked={
											!! this.props.getOptionValue(
												'wpcom_publish_comments_with_markdown',
												'markdown'
											)
										}
										disabled={
											this.props.isSavingAnyOption( [ 'markdown' ] ) ||
											this.props.isSavingAnyOption( [
												'wpcom_publish_comments_with_markdown',
											] ) ||
											'inactive' === this.props.getModuleOverride( 'markdown' )
										}
										onChange={ this.handleMarkdownCommentsToggle }
										label={
											<span className="jp-form-toggle-explanation">
												{ __( 'Enable Markdown use for comments.', 'jetpack' ) }
											</span>
										}
									/>
								</Fieldset.Root>
								<SupportInfo
									text={ __( 'Allow readers to use markdown in comments.', 'jetpack' ) }
									link={ markdown.learn_more_button }
									privacyLink={ markdown.learn_more_button + '#privacy' }
								/>
							</div>
						) }
						{ foundCommentLikes && (
							<div className="jp-toggle-set">
								<Fieldset.Root className="jp-form-fieldset">
									<ModuleToggle
										slug="comment-likes"
										compact
										disabled={ commentLikesUnavailable }
										activated={ commentLikesActive }
										toggling={ this.props.isSavingAnyOption( 'comment-likes' ) }
										toggleModule={ this.props.toggleModuleNow }
									>
										<span className="jp-form-toggle-explanation">
											{ __( 'Enable comment Likes.', 'jetpack' ) }
										</span>
									</ModuleToggle>
								</Fieldset.Root>
								<SupportInfo
									text={ __( 'Allow readers to like individual comments.', 'jetpack' ) }
									link={ getRedirectUrl( 'jetpack-support-comment-likes' ) }
									privacyLink={ getRedirectUrl( 'jetpack-support-comment-likes', {
										anchor: 'privacy',
									} ) }
								/>
							</div>
						) }
					</SettingsGroup>
				) }
			</SettingsCard>
		);
	}
}

export const Comments = withModuleSettingsFormHelpers( CommentsComponent );
