import { getRedirectUrl } from '@automattic/jetpack-components';
import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Component } from 'react';
import { FormFieldset, FormLabel } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import SupportInfo from 'components/support-info';
import TextInput from 'components/text-input';
import CommentFormPreview from './preview';

import './style.scss';

class CommentsComponent extends Component {
	handleToggle = option => () => {
		this.props.updateFormStateModuleOption( 'comments', option );
	};

	renderBlockOption( option, label, isCommentsActive ) {
		const { getOptionValue, isSavingAnyOption } = this.props;

		return (
			<ToggleControl
				checked={ !! getOptionValue( option, 'comments' ) }
				disabled={
					! isCommentsActive ||
					! getOptionValue( 'enable_blocks_comments', 'comments' ) ||
					this.props.isUnavailableInOfflineMode( 'comments' ) ||
					isSavingAnyOption( [ 'comments', 'enable_blocks_comments', option ] )
				}
				onChange={ this.handleToggle( option ) }
				label={ <span className="jp-form-toggle-explanation">{ label }</span> }
				__nextHasNoMarginBottom={ true }
			/>
		);
	}

	renderPreview( isCommentsActive ) {
		const { preview, getOptionValue } = this.props;
		const newsletter = {
			subscribeBlog: !! getOptionValue( 'stb_enabled', 'subscriptions' ),
			subscribeReplies: !! getOptionValue( 'stc_enabled', 'subscriptions' ),
		};

		return (
			<SettingsGroup>
				<h3 className="jp-form-label-wide jp-comments-preview__title">
					{ __( 'Preview', 'jetpack' ) }
				</h3>
				<div className="jp-comments-preview">
					<CommentFormPreview
						isJetpackForm={ isCommentsActive }
						hasBlocks={
							this.props.hasBlockEditor && !! getOptionValue( 'enable_blocks_comments', 'comments' )
						}
						prompt={ getOptionValue( 'highlander_comment_form_prompt' ) ?? '' }
						newsletter={ newsletter }
						preview={ preview }
					/>
				</div>
				<p className="jp-form-setting-explanation">
					{ isCommentsActive
						? __( 'The Jetpack form takes your theme’s fonts and colors.', 'jetpack' )
						: __(
								'Your theme styles its own comment form, so it may look different on your site.',
								'jetpack'
							) }{ ' ' }
					{ ! preview.theme &&
						`${ __(
							'Your theme does not share its styles, so the preview uses plain fonts and colors.',
							'jetpack'
						) } ` }
					{ __( 'The preview shows the form as you see it while logged in.', 'jetpack' ) }
				</p>
			</SettingsGroup>
		);
	}

	render() {
		if ( ! this.props.isModuleFound( 'comments' ) ) {
			return null;
		}

		const comments = this.props.getModule( 'comments' ),
			isCommentsActive = this.props.getOptionValue( 'comments' ),
			commentsUnavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'comments' );

		return (
			<SettingsCard
				{ ...this.props }
				header={ __( 'Comment form', 'jetpack' ) }
				module="comments"
				saveDisabled={ this.props.isSavingAnyOption( [
					'highlander_comment_form_prompt',
					'enable_blocks_comments',
				] ) }
			>
				{ this.props.preview && this.renderPreview( isCommentsActive ) }
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
						wpcomLink: 'https://wordpress.com/support/comments/',
					} }
				>
					<ModuleToggle
						slug="comments"
						compact
						disabled={
							commentsUnavailableInOfflineMode || this.props.isSavingAnyOption( 'comments' )
						}
						activated={ isCommentsActive }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">{ comments.description }</span>
					</ModuleToggle>
					{ this.props.hasBlockEditor && (
						<FormFieldset className="jp-comments-blocks">
							<ToggleControl
								checked={ !! this.props.getOptionValue( 'enable_blocks_comments', 'comments' ) }
								disabled={
									! isCommentsActive ||
									commentsUnavailableInOfflineMode ||
									this.props.isSavingAnyOption( [ 'comments', 'enable_blocks_comments' ] )
								}
								onChange={ this.handleToggle( 'enable_blocks_comments' ) }
								label={
									<span className="jp-form-toggle-explanation">
										{ __( 'Enable blocks in comments.', 'jetpack' ) }
									</span>
								}
								__nextHasNoMarginBottom={ true }
							/>
							<div className="jp-comments-block-options">
								{ this.renderBlockOption(
									'jetpack_comments_images',
									__( 'Allow images from links.', 'jetpack' ),
									isCommentsActive
								) }
								{ this.renderBlockOption(
									'jetpack_comments_embeds',
									__( 'Allow embeds from YouTube, X, and other services.', 'jetpack' ),
									isCommentsActive
								) }
							</div>
						</FormFieldset>
					) }
					<FormFieldset>
						<FormLabel>
							<span className="jp-form-label-wide">
								{ __( 'Comment form introduction', 'jetpack' ) }
							</span>
							<TextInput
								name={ 'highlander_comment_form_prompt' }
								value={ this.props.getOptionValue( 'highlander_comment_form_prompt' ) }
								disabled={
									! isCommentsActive ||
									commentsUnavailableInOfflineMode ||
									this.props.isSavingAnyOption( 'highlander_comment_form_prompt' )
								}
								onChange={ this.props.onOptionChange }
							/>
						</FormLabel>
						<span className="jp-form-setting-explanation">
							{ __( 'A few catchy words to motivate your visitors to comment.', 'jetpack' ) }
						</span>
					</FormFieldset>
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

export const Comments = withModuleSettingsFormHelpers( CommentsComponent );

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
