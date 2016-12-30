/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import get from 'lodash/get';

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
