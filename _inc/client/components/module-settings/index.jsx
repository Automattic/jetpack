/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';

/**
 * Internal dependencies
 */
import {
	FormFieldset,
	FormLegend,
	FormButton
} from 'components/forms';

import {
	ModuleSettingRadios,
	ModuleSettingCheckbox
} from 'components/module-settings/form-components';

import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';

import ExternalLink from 'components/external-link';

export let VideoPressSettings = React.createClass( {
	render() {
		return (
			<div>
				<p className="jp-form-setting-explanation">
					{ __( 'The easiest way to upload ad-free and unbranded videos to your site. You get stats on video playback and shares and the player is lightweight and responsive.' ) }
				</p>
				<p className="jp-form-setting-explanation">
					{ __( 'To get started, click on Add Media in your post editor and upload a video; we’ll take care of the rest!' ) }
				</p>
			</div>
		)
	}
} );

VideoPressSettings = moduleSettingsForm( VideoPressSettings );

export let SharedaddySettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<ModuleSettingCheckbox name={ 'option_name' } { ...this.props } label={ __( 'Subscriber' ) } />
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		)
	}
} );

SharedaddySettings = moduleSettingsForm( SharedaddySettings );

export let RelatedPostsSettings = React.createClass( {
	renderPreviews() {
		const show_headline = this.props.getOptionValue( 'show_headline' );
		const show_thumbnails = this.props.getOptionValue( 'show_thumbnails' );
		const previews = [ {
			url: 'https://jetpackme.files.wordpress.com/2014/08/1-wpios-ipad-3-1-viewsite.png?w=350&h=200&crop=1',
			text: __( 'Big iPhone/iPad Update Now Available' )
		}, {
			url: 'https://jetpackme.files.wordpress.com/2014/08/wordpress-com-news-wordpress-for-android-ui-update2.jpg?w=350&h=200&crop=1',
			text: __( 'The WordPress for Android App Gets a Big Facelift' )
		}, {
			url: 'https://jetpackme.files.wordpress.com/2014/08/videopresswedding.jpg?w=350&h=200&crop=1',
			text: __( 'Upgrade Focus: VideoPress For Weddings' )
		} ];

		return (
			<div className="jp-related-posts-preview">
				{
					show_headline ?
						<div className="jp-related-posts-preview__title">{ __( 'Related' ) }</div> :
						''
				}
				{
					previews.map( ( preview, i ) => (
						<span key={ `preview_${ i }` } className="jp-related-posts-preview__item" >
							{
								show_thumbnails ? <img src={ preview.url } /> : ''
							}
							<span><a href="#/engagement"> { preview.text } </a></span>
						</span>
					) )
				}
			</div>
		);
	},
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					{
						__( '{{span}}You can now also configure related posts in the Customizer. {{ExternalLink}}Try it out!{{/ExternalLink}}{{/span}}', {
							components: {
								span: <span className="jp-form-setting-explanation" />,
								ExternalLink: <ExternalLink
									className="jp-module-settings__external-link"
									href={ this.props.siteAdminUrl +
									'customize.php?autofocus[section]=jetpack_relatedposts' +
									'&return=' + encodeURIComponent( this.props.siteAdminUrl + 'admin.php?page=jetpack#/engagement' ) +
									'&url=' + encodeURIComponent( this.props.lastPostUrl ) } />
							}
						} )
					}
					<ModuleSettingCheckbox
						name={ 'show_headline' }
						label={ __( 'Show a "Related" header to more clearly separate the related section from posts' ) }
						{ ...this.props } />
					<ModuleSettingCheckbox
						name={ 'show_thumbnails' }
						label={ __( 'Use a large and visually striking layout' ) }
						{ ...this.props } />
					<div className="jp-related-posts-settings__preview-label">{ __( 'Preview' ) }</div>
					<Card>
						{ this.renderPreviews() }
					</Card>
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		);
	}
} );

RelatedPostsSettings = moduleSettingsForm( RelatedPostsSettings );

export let LikesSettings = React.createClass( {
	render() {
		const old_sharing_settings_url = this.props.module.configure_url;
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<FormLegend> { __( 'WordPress.com Likes are:' ) }</FormLegend>
					<ModuleSettingRadios
						name={ 'wpl_default' }
						{ ...this.props }
						validValues={ this.props.validValues( 'wpl_default' ) } />
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
				<p>
					{
						__( '{{a}}Manage Likes visibility from the Sharing Module Settings{{/a}}', {
							components: {
								a: <a href={ old_sharing_settings_url } />
							}
						} )
					}
				</p>
			</form>
		)
	}
} );

LikesSettings = moduleSettingsForm( LikesSettings );

export let MonitorSettings = React.createClass( {
	render() {
		return (
			<span className="jp-form-setting-explanation"><span>
				{

					__( '{{link}}Configure your Monitor notificaton settings on WordPress.com{{/link}}', {
						components: {
							link: <ExternalLink className="jp-module-settings__external-link" icon={ true } iconSize={ 16 } href={  'https://wordpress.com/settings/security/' + this.props.module.raw_url } />,
						}
					} )
				}
			</span></span>
		)
	}
} );

MonitorSettings = moduleSettingsForm( MonitorSettings );

export let WordAdsSettings = React.createClass( {
	render() {
		return (
			<div>
				<p>{ __( 'By default ads are shown at the end of every page, post, or the first article on your front page. You can also add them to the top of your site and to any widget area to increase your earnings!' ) }</p>
				<form onSubmit={ this.props.onSubmit } >
					<FormFieldset>
						<ModuleSettingCheckbox
							name={ 'enable_header_ad' }
							{ ...this.props }
							label={ __( 'Display an ad unit at the top of your site.' ) } />
						<FormButton
							className="is-primary"
							isSubmitting={ this.props.isSavingAnyOption() }
							disabled={ this.props.shouldSaveButtonBeDisabled() } />
					</FormFieldset>
				</form>
			</div>
		);
	}
} );

WordAdsSettings = moduleSettingsForm( WordAdsSettings );
