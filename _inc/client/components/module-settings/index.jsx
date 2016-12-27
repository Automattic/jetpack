/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import TextInput from 'components/text-input';
import Textarea from 'components/textarea';
import TagsInput from 'components/tags-input';
import ClipboardButtonInput from 'components/clipboard-button-input';
import ConnectButton from 'components/connect-button';
import get from 'lodash/get';
import Button from 'components/button';

/**
 * Internal dependencies
 */

import {
	FormFieldset,
	FormLegend,
	FormLabel,
	FormButton
} from 'components/forms';

import {
	ModuleSettingRadios,
	ModuleSettingCheckbox,
	ModuleSettingMultipleSelectCheckboxes
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

export let CarouselSettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<FormLegend> { __( 'Mobile Promos' ) } </FormLegend>
					<ModuleSettingCheckbox
						name={ 'carousel_display_exif' }
						{ ...this.props }
						label={ __( 'Show photo metadata (Exif) in carousel, when available' ) } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend> { __( 'Background Color' ) }</FormLegend>
					<ModuleSettingRadios
						name={ 'carousel_background_color' }
						{ ...this.props }
						validValues={ this.props.validValues( 'carousel_background_color' ) } />
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		)
	}
} );

CarouselSettings = moduleSettingsForm( CarouselSettings );

export let InfiniteScrollSettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<ModuleSettingCheckbox
						name={ 'infinite_scroll' }
						{ ...this.props }
						label={ __( 'Scroll infinitely (Shows 7 posts on each load)' ) } />
					<ModuleSettingCheckbox
						name={ 'infinite_scroll_google_analytics' }
						{ ...this.props }
						label={ __( 'Track each infinite Scroll post load as a page view in Google Analytics' ) } />
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		)
	}
} );

InfiniteScrollSettings = moduleSettingsForm( InfiniteScrollSettings );

export let MinilevenSettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<FormLegend> { __( 'Excerpts' ) } </FormLegend>
						<ModuleSettingRadios
							name={ 'wp_mobile_excerpt' }
							{ ...this.props }
							validValues={ this.props.validValues( 'wp_mobile_excerpt' ) } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend> { __( 'Featured Images' ) } </FormLegend>
						<ModuleSettingRadios
							name={ 'wp_mobile_featured_images' }
							{ ...this.props }
							validValues={ this.props.validValues( 'wp_mobile_featured_images' ) } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend> { __( 'Mobile Promos' ) } </FormLegend>
					<ModuleSettingCheckbox
						name={ 'wp_mobile_app_promos' }
						{ ...this.props }
						label={ __( 'Show a promo for the WordPress mobile apps in the footer of the mobile theme' ) } />
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		)
	}
 } );

MinilevenSettings = moduleSettingsForm( MinilevenSettings );

export let TiledGallerySettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<ModuleSettingCheckbox
						name={ 'tiled_galleries' }
						{ ...this.props }
						label={ __( 'Display all your gallery pictures in a cool mosaic' ) } />
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		)
	}
} );

TiledGallerySettings = moduleSettingsForm( TiledGallerySettings );

export let PostByEmailSettings = React.createClass( {
	regeneratePostByEmailAddress( event ) {
		event.preventDefault();
		this.props.regeneratePostByEmailAddress();
	},
	address() {
		const currentValue = this.props.getOptionValue( 'post_by_email_address' );
		// If the module Post-by-email is enabled BUT it's configured as disabled
		// Its value is set to false
		if ( currentValue === false ) {
			return '';
		}
		return currentValue;
	},
	render() {
		return (
			this.props.isCurrentUserLinked ?
				<form>
					<FormFieldset>
						<FormLabel>
							<FormLegend>{ __( 'Email Address' ) }</FormLegend>
							<ClipboardButtonInput
								value={ this.address() }
								copy={ __( 'Copy', { context: 'verb' } ) }
								copied={ __( 'Copied!' ) }
								prompt={ __( 'Highlight and copy the following text to your clipboard:' ) }
							/>
							<FormButton
								onClick={ this.regeneratePostByEmailAddress } >
								{ __( 'Regenerate address' ) }
							</FormButton>
						</FormLabel>
					</FormFieldset>
				</form>
				:
				<div>
					{
						<div className="jp-connection-settings">
							<div className="jp-connection-settings__headline">{ __( 'Link your account to WordPress.com to start using this feature.' ) }</div>
							<div className="jp-connection-settings__actions">
								<ConnectButton connectUser={ true } from="post-by-email" />
							</div>
						</div>
					}
				</div>
		)
	}
} );

PostByEmailSettings.propTypes = {
	isCurrentUserLinked: React.PropTypes.bool.isRequired
};

PostByEmailSettings = moduleSettingsForm( PostByEmailSettings );

export let CustomContentTypesSettings = React.createClass( {
	render() {
		let portfolioConfigure = () => {
			return ! this.props.getOptionCurrentValue( this.props.module.module, 'jetpack_portfolio' ) ?
				'' :
				<Button
					disabled={ ! this.props.shouldSaveButtonBeDisabled() }
					href={ this.props.siteAdminUrl + 'edit.php?post_type=jetpack-portfolio' }
					compact={ true }
				>{ __( 'Configure Portfolios' ) }</Button>;
		};

		let testimonialConfigure = () => {
			return ! this.props.getOptionCurrentValue( this.props.module.module, 'jetpack_testimonial' ) ?
				'' :
				<Button
					disabled={ ! this.props.shouldSaveButtonBeDisabled() }
					href={ this.props.siteAdminUrl + 'edit.php?post_type=jetpack-testimonial' }
					compact={ true }
				>{ __( 'Configure Testimonials' ) }</Button>;
		};

		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<ModuleSettingCheckbox
						name={ 'jetpack_portfolio' }
						{ ...this.props }
						label={ __( 'Enable Portfolio Projects for this site.' ) }
					/>
					<ModuleSettingCheckbox
						name={ 'jetpack_testimonial' }
						{ ...this.props }
						label={ __( 'Enable Testimonials for this site.' ) }
					/>
					<br/>
					{ portfolioConfigure() }
					{ testimonialConfigure() }
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		)
	}
} );

CustomContentTypesSettings.propTypes = {
	siteAdminUrl: React.PropTypes.string.isRequired
};

CustomContentTypesSettings = moduleSettingsForm( CustomContentTypesSettings );

;

export let WordAdsSettings = React.createClass( {
	render() {
		return (
			<div>
				<form onSubmit={ this.props.onSubmit } >
					<FormFieldset>
						<ModuleSettingCheckbox
							name={ 'enable_header_ad' }
							{ ...this.props }
							label={ __( 'Display an ad unit at the top of each page.' ) } />
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
