/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { FormFieldset, FormLegend, FormTextarea, FormLabel, FormButton} from 'components/forms';
import {
	ModuleOptionEnum,
	ModuleOptionBoolean,
	ModuleOptionTextInput
} from 'components/module-options';

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
				<ModuleOptionBoolean option_name={ 'stc_enabled' } { ...this.props } label={ __( 'Show a "follow comments" option in the comment form.' ) +
					' (Currently does not work)' } />
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

export const ProtectSettings = React.createClass( {
	render() {
		return (
			<FormFieldset>
				<span> { '(Currently does not work)' } </span>
				<FormLegend>{ __( 'Whitelist Management' ) }</FormLegend>
				<FormLabel>
					<span>{ __( 'IP addresses/ranges list' ) }</span>
					<FormTextarea></FormTextarea>
				</FormLabel>
			</FormFieldset>
		)
	}
} );

export const MonitorSettings = React.createClass( {
	render() {
		return (
			<FormFieldset>
				<ModuleOptionBoolean option_name={ 'monitor_receive_notifications' } { ...this.props } label={ __( 'Receive Monitor Email Notifications' ) } />
				<ModuleOptionBoolean option_name={ 'option_name' } { ...this.props } label={ __( 'Emails will be sent to admin address' ) +
					' (Currently does not work)' } />
			</FormFieldset>
		)
	}
} );

export const SingleSignOnSettings = React.createClass( {
	render() {
		return (
			<FormFieldset>
				<ModuleOptionBoolean option_name={ 'jetpack_sso_require_two_step' } { ...this.props } label={ __( 'Require Two-Step Authentication' ) } />
				<ModuleOptionBoolean option_name={ 'jetpack_sso_match_by_email' } { ...this.props } label={ __( 'Match By Email' ) } />
			</FormFieldset>
		)
	}
} );

export const MoreModulesSettings = React.createClass( {
	render() {
		let { module } = this.props;
		switch ( module.module ) {
			case 'minileven':
				return( <MinilevenSettings module={ module } { ...this.props } /> );
			case 'carousel':
				return( <CarouselSettings module={ module } { ...this.props } /> );
			case 'infinite-scroll':
				return( <InfiniteScrollSettings module={ module } { ...this.props } /> );
			case 'gravatar-hovercards':
				return( <GravatarHovercardsSettings module={ module } { ...this.props } /> );
			case 'tiled-gallery':
				return( <TiledGallerySettings module={ module } { ...this.props } /> );
			case 'post-by-email':
				return( <PostByEmailSettings module={ module } { ...this.props } /> );
			case 'custom-content-types':
				return( <CustomContentTypesSettings module={ module } { ...this.props } /> );
			case 'after-the-deadline':
				return( <AfterTheDeadlineSettings module={ module } { ...this.props } /> );

			case 'contact-form':
			case 'latex':
			case 'markdown':
			case 'photon':
			case 'widget-visibility':
			case 'shortlinks':
			case 'shortcodes':
			case 'json-api':
			case 'omnisearch':
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

export const MinilevenSettings = React.createClass( {
	render() {
		return (
			<div>
				<span>{ '(These options currently do not work)' } </span>
				<FormFieldset>
					<FormLegend> { __( 'Excerpts' ) } </FormLegend>
					<ModuleOptionEnum option_name={ 'wp_mobile_excerpt' } { ...this.props } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend> { __( 'Featured Images' ) } </FormLegend>
					<ModuleOptionEnum option_name={ 'wp_mobile_featured_images' } { ...this.props } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend> { __( 'Mobile Promos' ) } </FormLegend>
					<ModuleOptionBoolean option_name={ 'wp_mobile_app_promos' } { ...this.props } label={ __( 'Show a promo for the WordPress mobile apps in the footer of the mobile theme' ) } />
				</FormFieldset>
			</div>
		)
	}
 } );

export const CarouselSettings = React.createClass( {
	render() {
		return (
			<div>
				<FormFieldset>
					<FormLegend> { __( 'Mobile Promos' ) } </FormLegend>
					<ModuleOptionBoolean option_name={ 'carousel_display_exif' } { ...this.props } label={ __( 'Show photo metadata (Exif) in carousel, when available' ) } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend> { __( 'Background Color' ) }</FormLegend>
					<ModuleOptionEnum option_name={ 'carousel_background_color' } { ...this.props } />
				</FormFieldset>
			</div>
		)
	}
} );

export const InfiniteScrollSettings = React.createClass( {
	render() {
		return (
			<div>
				<FormFieldset>
					<ModuleOptionBoolean option_name={ 'infinite_scroll' } { ...this.props } label={ __( 'Scroll infinitely (Shows 7 posts on each load)' ) } />
					<ModuleOptionBoolean option_name={ 'infinite_scroll_google_analytics' } { ...this.props } label={ __( 'Track each infinite Scroll post load as a page view in Google Analytics' ) } />
				</FormFieldset>
			</div>
		)
	}
} );

export const GravatarHovercardsSettings = React.createClass( {
	render() {
		return (
			<div>
				<FormFieldset>
					<FormLegend>{ __( 'View people\'s profiles when you mouse over their Gravatars' ) }</FormLegend>
					<span> { '(Currently does not work)' } </span>
					<ModuleOptionEnum option_name={ 'gravatar_disable_hovercards' } { ...this.props } />
				</FormFieldset>
			</div>
		)
	}
} );

export const TiledGallerySettings = React.createClass( {
	render() {
		return (
			<div>
				<FormFieldset>
					<ModuleOptionBoolean option_name={ 'tiled_galleries' } { ...this.props } label={ __( 'Display all your gallery pictures in a cool mosaic' ) } />
				</FormFieldset>
			</div>
		)
	}
} );

export const PostByEmailSettings = React.createClass( {
	render() {
		return (
			<div>
				<FormFieldset>
					<span> { '(Currently does not work)' } </span>
					<ModuleOptionTextInput option_name={ 'post_by_email_address' } { ...this.props } label={ __( 'Email Address' ) } />
					<FormButton>{ __( 'Regenerate address' ) }</FormButton>
				</FormFieldset>
			</div>
		)
	}
} );

export const CustomContentTypesSettings = React.createClass( {
	render() {
		return (
			<div>
				<FormFieldset>
					<ModuleOptionBoolean option_name={ 'jetpack_portfolio' } { ...this.props } label={ __( 'Enable Portfolio Projects for this site' ) } />
					<ModuleOptionBoolean option_name={ 'jetpack_testimonial' } { ...this.props } label={ __( 'Enable Testimonials for this site' ) } />
				</FormFieldset>
			</div>
		)
	}
} );

export const AfterTheDeadlineSettings = React.createClass( {
	render() {
		return (
			<div>
				<FormFieldset>
					<FormLegend> { __( 'Proofreading' ) } </FormLegend>
					<ModuleOptionBoolean option_name={ 'onpublish' } { ...this.props } label={ __( 'A post or page is first published' ) } />
					<ModuleOptionBoolean option_name={ 'onupdate' } { ...this.props } label={ __( 'A post or page is updated' ) } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend> { __( 'English Options' ) } </FormLegend>
					<ModuleOptionBoolean option_name={ 'Bias Language' } { ...this.props } label={ __( 'Bias Language' ) } />
					<ModuleOptionBoolean option_name={ 'Cliches' } { ...this.props } label={ __( 'Cliches' ) } />
					<ModuleOptionBoolean option_name={ 'Complex Expression' } { ...this.props } label={ __( 'Complex Expression' ) } />
					<ModuleOptionBoolean option_name={ 'Diacritical Marks' } { ...this.props } label={ __( 'Diacritical Marks' ) } />
					<ModuleOptionBoolean option_name={ 'Double Negative' } { ...this.props } label={ __( 'Double Negative' ) } />
					<ModuleOptionBoolean option_name={ 'Hidden Verbs' } { ...this.props } label={ __( 'Hidden Verbs' ) } />
					<ModuleOptionBoolean option_name={ 'Jargon Language' } { ...this.props } label={ __( 'Jargon Language' ) } />
					<ModuleOptionBoolean option_name={ 'Passive voice' } { ...this.props } label={ __( 'Passive voice' ) } />
					<ModuleOptionBoolean option_name={ 'Phrases to Avoid' } { ...this.props } label={ __( 'Phrases to Avoid' ) } />
					<ModuleOptionBoolean option_name={ 'Redundant Expression' } { ...this.props } label={ __( 'Redundant Expression' ) } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend> { __( 'Language' ) } </FormLegend>
					<ModuleOptionBoolean option_name={ 'guess_lang' } { ...this.props } label={ __( 'Use automatically detected language to proofread posts and pages' ) } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend> { __( 'Ignored Phrases' ) } </FormLegend>
						<span> { '(Currently does not work)' } </span>
						<ModuleOptionTextInput option_name={ 'ignored_phrases' } { ...this.props } label={ __( 'New phrase' ) } />
				</FormFieldset>
			</div>
		)
	}
} );
