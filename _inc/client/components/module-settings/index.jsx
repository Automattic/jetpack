/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
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
