/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import {
	RelatedPostsSettings,
	SubscriptionsSettings,
	SharedaddySettings,
	ProtectSettings,
	MonitorSettings,
	SingleSignOnSettings,
	MinilevenSettings,
	CarouselSettings,
	InfiniteScrollSettings,
	GravatarHovercardsSettings,
	TiledGallerySettings,
	PostByEmailSettings,
	CustomContentTypesSettings,
	AfterTheDeadlineSettings
} from 'components/module-settings/';

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
			case 'sharedaddy':
				return ( <SharedaddySettings module={ module } { ...this.props } /> );
			case 'gravatar-hovercards':
				return( <GravatarHovercardsSettings module={ module } { ...this.props } /> );
			case 'likes':
			case 'notifications':
			case 'enhanced-distribution':
				return <span>{ __( 'This module has no configuration options' ) } </span>;
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

export const SecurityModulesSettings = React.createClass( {
	render() {
		let { module } = this.props;
		switch ( module.module ) {
			case 'protect':
				return( <ProtectSettings module={ module } { ...this.props } /> );
			case 'monitor':
				return ( <MonitorSettings module={ module } { ...this.props } /> );
			case 'scan':
				return ( <div>{ __( 'You can see the information about security scanning in the "At a Glance" section.' ) }</div> );
			case 'sso':
				return ( <SingleSignOnSettings module={ module } { ...this.props } /> );
			default:
				return (
					<div>
						<a href={ module.configure_url }>{ __( 'Link to old settings' ) }</a>
					</div>
				);
		}
	}
} );

export const AppearanceModulesSettings = React.createClass( {
	render() {
		let { module } = this.props;
		switch ( module.module ) {
			case 'tiled-gallery':
				return( <TiledGallerySettings module={ module } { ...this.props } /> );
			case 'minileven':
				return( <MinilevenSettings module={ module } { ...this.props } /> );
			case 'carousel':
				return( <CarouselSettings module={ module } { ...this.props } /> );
			case 'infinite-scroll':
				return( <InfiniteScrollSettings module={ module } { ...this.props } /> );
			case 'photon':
			case 'widget-visibility':
				return <span>{ __( 'This module has no configuration options' ) } </span>;
			case 'custom-css':
			case 'widgets':
			default:
				return (
					<div>
						<a href={ module.configure_url }>{ __( 'Link to old settings' ) }</a>
					</div>
				);
		}
	}
} );

export const WritingModulesSettings = React.createClass( {
	render() {
		let { module } = this.props;
		switch ( module.module ) {
			case 'post-by-email':
				return( <PostByEmailSettings module={ module } { ...this.props } /> );
			case 'custom-content-types':
				return( <CustomContentTypesSettings module={ module } { ...this.props } /> );
			case 'after-the-deadline':
				return( <AfterTheDeadlineSettings module={ module } { ...this.props } /> );
			case 'contact-form':
			case 'latex':
			case 'markdown':
			case 'shortlinks':
			case 'shortcodes':
				return <span>{ __( 'This module has no configuration options' ) } </span>;
			default:
				return (
					<div>
						<a href={ module.configure_url }>{ __( 'Link to old settings' ) }</a>
					</div>
				);
		}
	}
} );
