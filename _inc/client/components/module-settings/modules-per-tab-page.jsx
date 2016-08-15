/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import {
	StatsSettings,
	RelatedPostsSettings,
	CommentsSettings,
	LikesSettings,
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
	AfterTheDeadlineSettings,
	MarkdownSettings,
	VerificationToolsSettings,
} from 'components/module-settings/';
import Button from 'components/button';

export const AllModuleSettings = React.createClass( {
	render() {
		let { module } = this.props;
		switch ( module.module ) {
			case 'post-by-email':
				return( <PostByEmailSettings module={ module } { ...this.props } /> );
			case 'custom-content-types':
				return( <CustomContentTypesSettings module={ module } { ...this.props } /> );
			case 'after-the-deadline':
				return( <AfterTheDeadlineSettings module={ module } { ...this.props } /> );
			case 'markdown':
				return( <MarkdownSettings module={ module } { ...this.props } /> );
			case 'tiled-gallery':
				return( <TiledGallerySettings module={ module } { ...this.props } /> );
			case 'minileven':
				return( <MinilevenSettings module={ module } { ...this.props } /> );
			case 'carousel':
				return( <CarouselSettings module={ module } { ...this.props } /> );
			case 'infinite-scroll':
				return( <InfiniteScrollSettings module={ module } { ...this.props } /> );
			case 'protect':
				return( <ProtectSettings module={ module } { ...this.props } /> );
			case 'monitor':
				return ( <MonitorSettings module={ module } { ...this.props } /> );
			case 'scan':
				return (
					<div>
						{ __( 'You can see the information about security scanning in the "At a Glance" section.' ) }
						<br/><Button compact href={ module.configure_url }>{ __( 'Settings' ) }</Button>
					</div>
				);
			case 'sso':
				return ( <SingleSignOnSettings module={ module } { ...this.props } /> );
			case 'stats':
				return( <StatsSettings module={ module } { ...this.props } /> );
			case 'related-posts':
				return ( <RelatedPostsSettings module={ module } { ...this.props } /> );
			case 'comments':
				return ( <CommentsSettings module={ module } { ...this.props } /> );
			case 'subscriptions':
				return ( <SubscriptionsSettings module={ module } { ...this.props } /> );
			case 'gravatar-hovercards':
				return ( <GravatarHovercardsSettings module={ module } { ...this.props } /> );
			case 'likes':
				return ( <LikesSettings module={ module } { ...this.props } /> );
			case 'verification-tools':
				return ( <VerificationToolsSettings module={ module } { ...this.props } /> );
			case 'contact-form':
			case 'latex':
			case 'shortlinks':
			case 'shortcodes':
			case 'photon':
			case 'widget-visibility':
			case 'notifications':
			case 'enhanced-distribution':
			case 'sitemaps':
				return <span className="jp-form-setting-explanation">{ __( 'This module has no configuration options' ) } </span>;
			case 'custom-css':
			case 'widgets':
			case 'publicize':
			case 'sharedaddy':
			default:
				return (
					<div>
						<Button compact href={ module.configure_url }>{ __( 'Settings' ) }</Button>
					</div>
				);
		}
	}
} );
