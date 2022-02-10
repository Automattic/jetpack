/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import { FormFieldset, FormLegend, FormButton } from 'components/forms';
import {
	ModuleSettingRadios,
	ModuleSettingCheckbox,
} from 'components/module-settings/form-components';

import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';

import ExternalLink from 'components/external-link';

export class VideoPressSettings extends React.Component {
	render() {
		return (
			<div>
				<p className="jp-form-setting-explanation">
					{ __(
						'The easiest way to upload ad-free and unbranded videos to your site. You get stats on video playback and shares and the player is lightweight and responsive.',
						'jetpack'
					) }
				</p>
				<p className="jp-form-setting-explanation">
					{ __(
						'To get started, click on Add Media in your post editor and upload a video; we’ll take care of the rest!',
						'jetpack'
					) }
				</p>
			</div>
		);
	}
}

VideoPressSettings = withModuleSettingsFormHelpers( VideoPressSettings );

export class SharedaddySettings extends React.Component {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit }>
				<FormFieldset>
					<ModuleSettingCheckbox
						name={ 'option_name' }
						{ ...this.props }
						label={ __( 'Subscriber', 'jetpack' ) }
					/>
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() }
					/>
				</FormFieldset>
			</form>
		);
	}
}

SharedaddySettings = withModuleSettingsFormHelpers( SharedaddySettings );

export class RelatedPostsSettings extends React.Component {
	renderPreviews = () => {
		const show_headline = this.props.getOptionValue( 'show_headline' );
		const show_thumbnails = this.props.getOptionValue( 'show_thumbnails' );
		const previews = [
			{
				url: 'https://jetpackme.files.wordpress.com/2019/03/cat-blog.png',
				text: __( 'Big iPhone/iPad Update Now Available', 'jetpack' ),
			},
			{
				url: 'https://jetpackme.files.wordpress.com/2019/03/devices.jpg',
				text: __( 'The WordPress for Android App Gets a Big Facelift', 'jetpack' ),
			},
			{
				url: 'https://jetpackme.files.wordpress.com/2019/03/mobile-wedding.jpg',
				text: __( 'Upgrade Focus: VideoPress For Weddings', 'jetpack' ),
			},
		];

		return (
			<div className="jp-related-posts-preview">
				{ show_headline ? (
					<div className="jp-related-posts-preview__title">
						{ _x( 'Related', 'A heading for a block of related posts.', 'jetpack' ) }
					</div>
				) : (
					''
				) }
				{ previews.map( ( preview, i ) => (
					<span key={ `preview_${ i }` } className="jp-related-posts-preview__item">
						{ show_thumbnails ? <img src={ preview.url } alt={ preview.text } /> : '' }
						<span>
							<a href="#/engagement"> { preview.text } </a>
						</span>
					</span>
				) ) }
			</div>
		);
	};

	render() {
		return (
			<form onSubmit={ this.props.onSubmit }>
				<FormFieldset>
					{ createInterpolateElement(
						__(
							'<span>You can now also configure related posts in the Customizer. <ExternalLink>Try it out!</ExternalLink></span>',
							'jetpack'
						),
						{
							span: <span className="jp-form-setting-explanation" />,
							ExternalLink: (
								<ExternalLink
									className="jp-module-settings__external-link"
									href={
										this.props.siteAdminUrl +
										'customize.php?autofocus[section]=jetpack_relatedposts' +
										'&return=' +
										encodeURIComponent(
											this.props.siteAdminUrl + 'admin.php?page=jetpack#/engagement'
										) +
										'&url=' +
										encodeURIComponent( this.props.lastPostUrl )
									}
								/>
							),
						}
					) }
					<ModuleSettingCheckbox
						name={ 'show_headline' }
						label={ __( 'Highlight related content with a heading', 'jetpack' ) }
						{ ...this.props }
					/>
					<ModuleSettingCheckbox
						name={ 'show_thumbnails' }
						label={ __( 'Show a thumbnail image where available', 'jetpack' ) }
						{ ...this.props }
					/>
					<div className="jp-related-posts-settings__preview-label">
						{ _x(
							'Preview',
							'Noun, a header for a preview block in a configuration screen.',
							'jetpack'
						) }
					</div>
					<Card>{ this.renderPreviews() }</Card>
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() }
					/>
				</FormFieldset>
			</form>
		);
	}
}

RelatedPostsSettings = withModuleSettingsFormHelpers( RelatedPostsSettings );

export class LikesSettings extends React.Component {
	render() {
		const old_sharing_settings_url = this.props.module.configure_url;
		return (
			<form onSubmit={ this.props.onSubmit }>
				<FormFieldset>
					<FormLegend> { __( 'WordPress.com Likes are:', 'jetpack' ) }</FormLegend>
					<ModuleSettingRadios
						name={ 'wpl_default' }
						{ ...this.props }
						validValues={ this.props.validValues( 'wpl_default' ) }
					/>
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() }
					/>
				</FormFieldset>
				<p>
					{ createInterpolateElement(
						__( '<a>Manage Likes visibility from the Sharing Module Settings</a>', 'jetpack' ),
						{
							a: <a href={ old_sharing_settings_url } />,
						}
					) }
				</p>
			</form>
		);
	}
}

LikesSettings = withModuleSettingsFormHelpers( LikesSettings );

export class MonitorSettings extends React.Component {
	render() {
		return (
			<span className="jp-form-setting-explanation">
				<span>
					{ createInterpolateElement(
						__(
							'<link>Configure your Monitor notification settings on WordPress.com</link>',
							'jetpack'
						),
						{
							link: (
								<ExternalLink
									className="jp-module-settings__external-link"
									icon={ true }
									iconSize={ 16 }
									href={ getRedirectUrl( 'calypso-settings-security', {
										site: this.props.module.raw_url,
									} ) }
								/>
							),
						}
					) }
				</span>
			</span>
		);
	}
}

MonitorSettings = withModuleSettingsFormHelpers( MonitorSettings );

export class WordAdsSettings extends React.Component {
	render() {
		return (
			<div>
				<p>
					{ __(
						'By default ads are shown at the end of every page, post, or the first article on your front page. You can also add them to the top of your site and to any widget area to increase your earnings!',
						'jetpack'
					) }
				</p>
				<form onSubmit={ this.props.onSubmit }>
					<FormFieldset>
						<ModuleSettingCheckbox
							name={ 'enable_header_ad' }
							{ ...this.props }
							label={ __( 'Display an ad unit at the top of your site.', 'jetpack' ) }
						/>
						<FormButton
							className="is-primary"
							isSubmitting={ this.props.isSavingAnyOption() }
							disabled={ this.props.shouldSaveButtonBeDisabled() }
						/>
					</FormFieldset>
				</form>
			</div>
		);
	}
}

WordAdsSettings = withModuleSettingsFormHelpers( WordAdsSettings );
