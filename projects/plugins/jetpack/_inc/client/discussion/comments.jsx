import { getRedirectUrl } from '@automattic/jetpack-components';
import { ToggleControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Component } from 'react';
import { FormFieldset, FormLabel, FormLegend } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import TextInput from 'components/text-input';
import CommentFormPreview from './preview';

import './style.scss';

class CommentsComponent extends Component {
	handleBlocksToggle = () => {
		this.props.updateFormStateModuleOption( 'comments', 'enable_blocks_comments' );
	};

	renderPreview( isCommentsActive ) {
		const { preview, getOptionValue } = this.props;
		const newsletter = {
			subscribeBlog: !! getOptionValue( 'stb_enabled', 'subscriptions' ),
			subscribeReplies: !! getOptionValue( 'stc_enabled', 'subscriptions' ),
		};

		return (
			<SettingsGroup>
				<FormLegend>{ __( 'Preview', 'jetpack' ) }</FormLegend>
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
					{ createInterpolateElement(
						__(
							'Name, email, and sign-in requirements follow your <a>Discussion settings</a>.',
							'jetpack'
						),
						{ a: <a href={ preview.discussion.url } /> }
					) }
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
						<FormFieldset>
							<ToggleControl
								checked={ !! this.props.getOptionValue( 'enable_blocks_comments', 'comments' ) }
								disabled={
									! isCommentsActive ||
									commentsUnavailableInOfflineMode ||
									this.props.isSavingAnyOption( [ 'comments', 'enable_blocks_comments' ] )
								}
								onChange={ this.handleBlocksToggle }
								label={
									<span className="jp-form-toggle-explanation">
										{ __( 'Enable blocks in comments.', 'jetpack' ) }
									</span>
								}
								__nextHasNoMarginBottom={ true }
							/>
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
				{ this.props.preview && this.renderPreview( isCommentsActive ) }
			</SettingsCard>
		);
	}
}

export const Comments = withModuleSettingsFormHelpers( CommentsComponent );
