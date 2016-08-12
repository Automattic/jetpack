/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import Button from 'components/button';
import TagsInput from 'components/tags-input';

/**
 * Internal dependencies
 */

import {
	FormFieldset,
	FormLegend,
	FormTextarea,
	FormTextInput,
	FormLabel,
	FormButton
} from 'components/forms';

import {
	ModuleSettingRadios,
	ModuleSettingCheckbox,
	ModuleSettingMultipleSelectCheckboxes
} from 'components/module-settings/form-components';

import { ModuleSettingsForm } from 'components/module-settings/module-settings-form';

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

SharedaddySettings = ModuleSettingsForm( SharedaddySettings );

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
			<div className="related-posts-settings_preview_container">
				{
					show_headline ?
						<h3>{ __( 'Related' ) }</h3> :
						''
				}
				{
					previews.map( ( preview, i ) => (
						<span key={ `preview_${ i }` } className="related-posts-settings_preview_image_container" >
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
					<ModuleSettingCheckbox
						name={ 'show_headline' }
						label={ __( 'Show a "Related" header to more clearly separate the related section from posts' ) }
						{ ...this.props } />
					<ModuleSettingCheckbox
						name={ 'show_thumbnails' }
						label={ __( 'Use a large and visually striking layout' ) }
						{ ...this.props } />
					<h3>{ __( 'Preview' ) }</h3>
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

RelatedPostsSettings = ModuleSettingsForm( RelatedPostsSettings );

export let LikesSettings = React.createClass( {
	render() {
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
			</form>
		)
	}
} );

LikesSettings = ModuleSettingsForm( LikesSettings );

export let CommentsSettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<FormLegend>{ __( 'Comments headline' ) }</FormLegend>
					<span className="form-setting-explanation">{ __( 'A few catchy words to motivate your readers to comment.' ) }</span>
					<FormLabel>
						<FormTextInput
							name={ 'highlander_comment_form_prompt' }
							value={ this.props.getOptionValue( 'highlander_comment_form_prompt' ) }
							disabled={ this.props.isUpdating( 'highlander_comment_form_prompt' ) }
							onChange={ this.props.onOptionChange} />
					</FormLabel>
				</FormFieldset>
				<FormFieldset>
					<FormLegend>{ __( 'Color Scheme' ) }</FormLegend>
					<ModuleSettingRadios
						name={ 'jetpack_comment_form_color_scheme' }
						{ ...this.props }
						validValues={ this.props.validValues( 'jetpack_comment_form_color_scheme' ) } />
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		)
	}
} );

CommentsSettings = ModuleSettingsForm( CommentsSettings );

export let SubscriptionsSettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<h3>{ __( 'Can readers subscribe to your posts, comments or both?' ) }</h3>
				<FormFieldset>
					<ModuleSettingCheckbox
						name={ "stb_enabled" }
						{ ...this.props }
						label={ __( 'Show a "follow blog" options in the comment form' ) } />
					<ModuleSettingCheckbox
						name={ 'stc_enabled' }
						{ ...this.props }
						label={ __( 'Show a "follow comments" option in the comment form.' ) +
							' (Currently does not work)' } />
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		)
	}
} );

SubscriptionsSettings = ModuleSettingsForm( SubscriptionsSettings );

export let StatsSettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<FormLegend>{ __( 'Admin Bar' ) }</FormLegend>
					<ModuleSettingCheckbox
						name={ 'admin_bar' }
						{ ...this.props }
						label={ __( 'Put a chart showing 48 hours of views in the admin bar' ) } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend>{ __( 'Smiley' ) }</FormLegend>
					<ModuleSettingCheckbox
						name={ 'hide_smile' }
						{ ...this.props }
						label={ __( 'Hide the stats smiley face image' ) } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend>{ __( 'Registered Users: Count the page views of registered users who are logged in' ) }</FormLegend>
					<ModuleSettingMultipleSelectCheckboxes
						name={ 'count_roles' }
						{ ...this.props }
						validValues={ this.props.getSiteRoles() } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend>{ __( 'Report Visibility: Select the roles that will be able to view stats reports' ) }</FormLegend>
					<ModuleSettingMultipleSelectCheckboxes
						always_checked={ [ 'administrator' ] }
						name={ 'roles' }
						{ ...this.props }
						validValues={ this.props.getSiteRoles() } />
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		);
	}
} );

StatsSettings = ModuleSettingsForm( StatsSettings );

export let ProtectSettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<span> { '(Currently does not work)' } </span>
					<FormLegend>{ __( 'Whitelist Management' ) }</FormLegend>
					<FormLabel>
						<span>{ __( 'IP addresses/ranges list' ) }</span>
						<FormTextarea
							name={ 'jetpack_protect_global_whitelist' }
							onChange={ this.props.onOptionChange }
							value={ this.props.getOptionValue( 'jetpack_protect_global_whitelist' ).local } />
					</FormLabel>
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		)
	}
} );

ProtectSettings = ModuleSettingsForm( ProtectSettings );

export let MonitorSettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<ModuleSettingCheckbox
						name={ 'monitor_receive_notifications' }
						{ ...this.props }
						label={ __( 'Receive Monitor Email Notifications' ) } />
					<p>
						<em>{ __( 'Emails will be sent to ' ) + this.props.adminEmailAddress }.</em>
						<span>
							&nbsp;
							{
								__( '{{a}}Edit{{/a}}', {
									components: {
										a: <a href={ 'https://wordpress.com/settings/account/' } />
									}
								} )
							}
						</span>
					</p>
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		)
	}
} );

MonitorSettings = ModuleSettingsForm( MonitorSettings );

export let SingleSignOnSettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<ModuleSettingCheckbox
						name={ 'jetpack_sso_match_by_email' }
						{ ...this.props }
						label={ __( 'Match By Email' ) } />
					<ModuleSettingCheckbox
						name={ 'jetpack_sso_require_two_step' }
						{ ...this.props }
						label={ __( 'Require Two-Step Authentication' ) } />
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		)
	}
} );

SingleSignOnSettings = ModuleSettingsForm( SingleSignOnSettings );

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

CarouselSettings = ModuleSettingsForm( CarouselSettings );

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

InfiniteScrollSettings = ModuleSettingsForm( InfiniteScrollSettings );

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

MinilevenSettings = ModuleSettingsForm( MinilevenSettings );

export let GravatarHovercardsSettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<FormLegend>{ __( 'View people\'s profiles when you mouse over their Gravatars' ) }</FormLegend>
					<ModuleSettingRadios
						name={ 'gravatar_disable_hovercards' }
						{ ...this.props }
						validValues={ this.props.validValues( 'gravatar_disable_hovercards' ) } />
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		)
	}
} );

GravatarHovercardsSettings = ModuleSettingsForm( GravatarHovercardsSettings );

export let VerificationToolsSettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<p>
						{
							__( 'Enter your meta key "content" value to verify your blog with {{a}}Google Search Console{{/a}}, {{a}}Bing Webmaster Center{{/a}} and {{a}}Pinterest Site Verification{{/a}}.', {
								components: {
									a: <a href="https://www.google.com/webmasters/tools/" target="_blank" />,
									a1: <a href="http://www.bing.com/webmaster/" target="_blank" />,
									a2: <a href="https://pinterest.com/website/verify/" target="_blank" />
								}
							} )
						}
					</p>

					<div className="dops-card">
						<FormLabel>
							<span>Google</span>
							<FormTextInput
								name={ 'google' }
								value={ this.props.getOptionValue( 'google' ) }
								className="widefat code"
								disabled={ this.props.isUpdating( 'google' ) }
								onChange={ this.props.onOptionChange} />
						</FormLabel>
						<p>
							{ __( 'Example:' ) }
						</p>
						<p className="small">
							&lt;meta name='google-site-verification' content='<strong className="code">dBw5CvburAxi537Rp9qi5uG2174Vb6JwHwIRwPSLIK8</strong>'&gt;
						</p>
					</div>

					<div className="dops-card">
						<FormLabel>
							<span>Bing</span>
							<FormTextInput
								name={ 'bing' }
								value={ this.props.getOptionValue( 'bing' ) }
								className="widefat code"
								disabled={ this.props.isUpdating( 'bing' ) }
								onChange={ this.props.onOptionChange} />
						</FormLabel>
						<p>
							{ __( 'Example:' ) }
						</p>
						<p className="small">
							&lt;meta name='msvalidate.01' content='<strong>12C1203B5086AECE94EB3A3D9830B2E</strong>'&gt;
						</p>
					</div>

					<div className="dops-card">
						<FormLabel>
							<span>Pinterest</span>
							<FormTextInput
								name={ 'pinterest' }
								value={ this.props.getOptionValue( 'pinterest' ) }
								className="widefat code"
								disabled={ this.props.isUpdating( 'pinterest' ) }
								onChange={ this.props.onOptionChange} />
						</FormLabel>
						<p>
							{ __( 'Example:' ) }
						</p>
						<p className="small">
							&lt;meta name='p:domain_verify' content='<strong>f100679e6048d45e4a0b0b92dce1efce</strong>'&gt;
						</p>
					</div>

					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		)
	}
} );

VerificationToolsSettings = ModuleSettingsForm( VerificationToolsSettings );

export let TiledGallerySettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<h3>{ __( 'Excerpts' ) }</h3>
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

TiledGallerySettings = ModuleSettingsForm( TiledGallerySettings );

export let PostByEmailSettings = React.createClass( {
	regeneratePostByEmailAddress() {
		this.props.regeneratePostByEmailAddress();
	},
	address() {
		const currentValue = this.props.getOptionValue( 'post_by_email_address' )
		// If the module Post-by-email is enabled BUT it's configured as disabled
		// Its value is set to false
		if ( currentValue === false ) {
			return '';
		}
		return currentValue;
	},
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<FormLabel>
						<span> { __( 'Email Address' ) } </span>
						<FormTextInput
							value={ this.address() }
							readOnly="readonly" />
						<Button
							onClick={ this.regeneratePostByEmailAddress } >
							{ __( 'Regenerate address' ) }
						</Button>
					</FormLabel>
				</FormFieldset>
			</form>
		)
	}
} );

PostByEmailSettings = ModuleSettingsForm( PostByEmailSettings );

export let CustomContentTypesSettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<ModuleSettingCheckbox
						name={ 'jetpack_portfolio' }
						{ ...this.props }
						label={ __( 'Enable Portfolio Projects for this site' ) } />
					<ModuleSettingCheckbox
						name={ 'jetpack_testimonial' }
						{ ...this.props }
						label={ __( 'Enable Testimonials for this site' ) } />
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		)
	}
} );

CustomContentTypesSettings = ModuleSettingsForm( CustomContentTypesSettings );

export let AfterTheDeadlineSettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<FormLegend> { __( 'Automatic proofread content when ' ) } </FormLegend>
					<ModuleSettingCheckbox
						name={ 'onpublish' }
						{ ...this.props }
						label={ __( 'A post or page is first published' ) } />
					<ModuleSettingCheckbox
						name={ 'onupdate' }
						{ ...this.props }
						label={ __( 'A post or page is updated' ) } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend> { __( 'English Options: Enable proofreading for the following grammar and style rules' ) } </FormLegend>
					<ModuleSettingCheckbox
						name={ 'Bias Language' }
						{ ...this.props }
						label={ __( 'Bias Language' ) } />
					<ModuleSettingCheckbox
						name={ 'Cliches' }
						{ ...this.props }
						label={ __( 'Clichés' ) } />
					<ModuleSettingCheckbox
						name={ 'Complex Expression' }
						{ ...this.props }
						label={ __( 'Complex Phrases' ) } />
					<ModuleSettingCheckbox
						name={ 'Diacritical Marks' }
						{ ...this.props }
						label={ __( 'Diacritical Marks' ) } />
					<ModuleSettingCheckbox
						name={ 'Double Negative' }
						{ ...this.props }
						label={ __( 'Double Negatives' ) } />
					<ModuleSettingCheckbox
						name={ 'Hidden Verbs' }
						{ ...this.props }
						label={ __( 'Hidden Verbs' ) } />
					<ModuleSettingCheckbox
						name={ 'Jargon Language' }
						{ ...this.props }
						label={ __( 'Jargon' ) } />
					<ModuleSettingCheckbox
						name={ 'Passive voice' }
						{ ...this.props }
						label={ __( 'Passive Voice' ) } />
					<ModuleSettingCheckbox
						name={ 'Phrases to Avoid' }
						{ ...this.props }
						label={ __( 'Phrases to Avoid' ) } />
					<ModuleSettingCheckbox
						name={ 'Redundant Expression' }
						{ ...this.props }
						label={ __( 'Redundant Phrases' ) } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend> { __( 'Language: The proofreader supports English, French, ' +
						'German, Portuguese and Spanish. Your user interface language (see above) ' +
						'is the default proofreading language.' ) }
					</FormLegend>
					<ModuleSettingCheckbox
						name={ 'guess_lang' }
						{ ...this.props }
						label={ __( 'Use automatically detected language to proofread posts and pages' ) } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend>
						{ __( 'Ignored Phrases' ) }
					</FormLegend>
					<TagsInput
						name="ignored_phrases"
						placeholder={ __( 'Add a phrase' ) }
						value={ this.props.getOptionValue( 'ignored_phrases' ) !== '' ?
							this.props.getOptionValue( 'ignored_phrases' ).split( ',' ) :
							[]
						}
						onChange={ this.props.onOptionChange } />
				</FormFieldset>
				<FormFieldset>
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		)
	}
} );

AfterTheDeadlineSettings = ModuleSettingsForm( AfterTheDeadlineSettings );

export let MarkdownSettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<ModuleSettingCheckbox
						name={ 'wpcom_publish_comments_with_markdown' }
						{ ...this.props }
						label={ __( 'Use Markdown for comments' ) } />
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		)
	}
} );

MarkdownSettings = ModuleSettingsForm( MarkdownSettings );
