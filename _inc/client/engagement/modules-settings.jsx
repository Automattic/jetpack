/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { FormFieldset, FormLegend } from 'components/forms';
import { ModuleOptionBoolean } from 'components/module-options';

export const EngagementModulesSettings = React.createClass( {
	render() {
		let { module } = this.props;

		switch ( module.module ) {
			// case 'stats':
				// return( <StatsSettings module={ module } { ...this.props } /> );
			case 'related-posts':
				return ( <RelatedPostsSettings module={ module } { ...this.props } /> );
			case 'subscriptions':
				return ( <SubscriptionsSettings module={ module } { ...this.props } /> );
			case 'likes':
			case 'notifications':
			case 'enhanced-distribution':
				return <span>{ __( 'This module has no configuration options' ) } </span>;
			case 'sharedaddy':
			case 'verification-tools':
			case 'publicize':
			default:
				return (
					<div>
						<a href={ module.configure_url }>{ __( 'Link to old settings' ) }</a>
					</div>
				);
		}
	}
} );

export const SharingSettings = React.createClass( {
	render() {
		return (
			<FormFieldset>
				<ModuleOptionBoolean option_name={ 'option_name' } { ...this.props } label={ __( 'Subscriber' ) } />
			</FormFieldset>
		)
	}
} );

export const RelatedPostsSettings = React.createClass( {
	render() {
		return (
			<FormFieldset>
				<ModuleOptionBoolean option_name={ 'show_headline' } { ...this.props } label={ __( 'Show a "Related" header to more clearly separate the related section from posts' ) } />
				<ModuleOptionBoolean option_name={ 'show_thumbnails' } { ...this.props } label={ __( 'Use a large and visually striking layout' ) } />
			</FormFieldset>
		)
	}
} );

export const SubscriptionsSettings = React.createClass( {
	render() {
		return (
			<FormFieldset>
				<ModuleOptionBoolean option_name={ "stb_enabled" } { ...this.props } label={ __( 'Show a "follow blog" options in the comment form' ) } />
				<ModuleOptionBoolean option_name={ 'stc_enabled' } { ...this.props } label={ __( 'Show a "follow comments" option in the comment form.' ) } />
			</FormFieldset>
		)
	}
} );

export const StatsSettings = React.createClass( {
	render() {
		return (
			<div>
				<FormFieldset>
					<FormLegend>{ __( 'Admin Bar' ) }</FormLegend>
					<ModuleOptionBoolean option_name={ 'option_name' } { ...this.props } label={ __( 'Put a chart showing 48 hours of views in the admin bar' ) } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend>{ __( 'Registered Users' ) }</FormLegend>
					<ModuleOptionBoolean option_name={ 'option_name' } { ...this.props } label={ __( 'Administrator' ) } />
					<ModuleOptionBoolean option_name={ 'option_name' } { ...this.props } label={ __( 'Editor' ) } />
					<ModuleOptionBoolean option_name={ 'option_name' } { ...this.props } label={ __( 'Author' ) } />
					<ModuleOptionBoolean option_name={ 'option_name' } { ...this.props } label={ __( 'Contributor' ) } />
					<ModuleOptionBoolean option_name={ 'option_name' } { ...this.props } label={ __( 'Subscriber' ) } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend>{ __( 'Smiley' ) }</FormLegend>
					<ModuleOptionBoolean option_name={ 'option_name' } { ...this.props } label={ __( 'Hide the stats smiley face image' ) } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend>{ __( 'Report Visibility' ) }</FormLegend>
					<ModuleOptionBoolean option_name={ 'option_name' } { ...this.props } label={ __( 'Administrator' ) } />
					<ModuleOptionBoolean option_name={ 'option_name' } { ...this.props } label={ __( 'Editor' ) } />
					<ModuleOptionBoolean option_name={ 'option_name' } { ...this.props } label={ __( 'Author' ) } />
					<ModuleOptionBoolean option_name={ 'option_name' } { ...this.props } label={ __( 'Contributor' ) } />
					<ModuleOptionBoolean option_name={ 'option_name' } { ...this.props } label={ __( 'Subscriber' ) } />
				</FormFieldset>
			</div>
		);
	}
} );
