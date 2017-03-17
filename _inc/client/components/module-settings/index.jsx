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

export let CommentsSettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<FormLegend>{ __( 'Comments headline' ) }</FormLegend>
					<FormLabel>
						<TextInput
							name={ 'highlander_comment_form_prompt' }
							value={ this.props.getOptionValue( 'highlander_comment_form_prompt' ) }
							disabled={ this.props.isUpdating( 'highlander_comment_form_prompt' ) }
							onChange={ this.props.onOptionChange} />
					</FormLabel>
					<span className="jp-form-setting-explanation">{ __( 'A few catchy words to motivate your readers to comment.' ) }</span>
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

CommentsSettings = moduleSettingsForm( CommentsSettings );

export let SubscriptionsSettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormLegend>{ __( 'Can readers subscribe to your posts, comments or both?' ) }</FormLegend>
				<FormFieldset>
					<ModuleSettingCheckbox
						name={ "stb_enabled" }
						{ ...this.props }
						label={ __( 'Show a "follow blog" options in the comment form' ) } />
					<ModuleSettingCheckbox
						name={ 'stc_enabled' }
						{ ...this.props }
						label={ __( 'Show a "follow comments" option in the comment form.' ) } />
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		)
	}
} );

SubscriptionsSettings = moduleSettingsForm( SubscriptionsSettings );

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
						label={ __( 'Hide the stats smiley face image. The image helps collect stats but should still work when hidden.' ) } />
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

StatsSettings = moduleSettingsForm( StatsSettings );

export let ProtectSettings = React.createClass( {
	render() {
		const maybeShowIp = this.props.currentIp ?
			<p>{ __( 'Your Current IP: %(ip)s', { args: { ip: this.props.currentIp } } ) }</p> :
			'';

		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<FormLegend>{ __( 'Whitelist Management' ) }</FormLegend>
					<p>{ __( 'Whitelisting an IP address prevents it from ever being blocked by Jetpack.' ) }</p>
					<small>{ __( 'Make sure to add your most frequently used IP addresses as they can change between your home, office or other locations. Removing an IP address from the list below will remove it from your whitelist.' ) }</small>
					{ maybeShowIp }
					<FormLabel>
						<Textarea
							name={ 'jetpack_protect_global_whitelist' }
							placeholder={ 'Example: 12.12.12.1-12.12.12.100' }
							onChange={ this.props.onOptionChange }
							value={ this.props.getOptionValue( 'jetpack_protect_global_whitelist' ).local } />
					</FormLabel>
					<span className="jp-form-setting-explanation">{ __( 'IPv4 and IPv6 are acceptable. Enter multiple IPs on separate lines. {{br/}} To specify a range, enter the low value and high value separated by a dash. Example: 12.12.12.1-12.12.12.100', {
						components: {
							br: <br/>
						}
					} ) }</span>
					<FormButton
						className="is-primary"
						isSubmitting={ this.props.isSavingAnyOption() }
						disabled={ this.props.shouldSaveButtonBeDisabled() } />
				</FormFieldset>
			</form>
		)
	}
} );

ProtectSettings.propTypes = {
	currentIp: React.PropTypes.string.isRequired
};

ProtectSettings = moduleSettingsForm( ProtectSettings );

export let MonitorSettings = React.createClass( {
	render() {
		return (
			<span className="jp-form-setting-explanation"><span>
				{

					__( '{{link}}Configure your Monitor notification settings on WordPress.com{{/link}}', {
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

SingleSignOnSettings = moduleSettingsForm( SingleSignOnSettings );

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
						label={ __( 'Track each scroll load (7 posts by default) as a page view in Google Analytics' ) } />
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

export let VerificationToolsSettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<p className="jp-form-setting-explanation">
						{
							__( 'Enter your meta key "content" value to verify your blog with {{a}}Google Search Console{{/a}}, {{a1}}Bing Webmaster Center{{/a1}} and {{a2}}Pinterest Site Verification{{/a2}}.', {
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
							<FormLegend>Google</FormLegend>
							<TextInput
								name={ 'google' }
								value={ this.props.getOptionValue( 'google' ) }
								placeholder={ 'Example: dBw5CvburAxi537Rp9qi5uG2174Vb6JwHwIRwPSLIK8' }
								className="widefat code"
								disabled={ this.props.isUpdating( 'google' ) }
								onChange={ this.props.onOptionChange} />
						</FormLabel>
						<span className="jp-form-setting-explanation">
							{ __( 'Meta key example:' ) }
							&nbsp;&lt;meta name='google-site-verification' content='<strong className="code">dBw5CvburAxi537Rp9qi5uG2174Vb6JwHwIRwPSLIK8</strong>'&gt;
						</span>
					</div>

					<div className="dops-card">
						<FormLabel>
							<FormLegend>Bing</FormLegend>
							<TextInput
								name={ 'bing' }
								value={ this.props.getOptionValue( 'bing' ) }
								placeholder={ 'Example: 12C1203B5086AECE94EB3A3D9830B2E' }
								className="widefat code"
								disabled={ this.props.isUpdating( 'bing' ) }
								onChange={ this.props.onOptionChange} />
						</FormLabel>
						<span className="jp-form-setting-explanation">
							{ __( 'Meta key example:' ) }
							&nbsp;&lt;meta name='msvalidate.01' content='<strong>12C1203B5086AECE94EB3A3D9830B2E</strong>'&gt;
						</span>
					</div>

					<div className="dops-card">
						<FormLabel>
							<FormLegend>Pinterest</FormLegend>
							<TextInput
								name={ 'pinterest' }
								value={ this.props.getOptionValue( 'pinterest' ) }
								placeholder={ 'Example: f100679e6048d45e4a0b0b92dce1efce' }
								className="widefat code"
								disabled={ this.props.isUpdating( 'pinterest' ) }
								onChange={ this.props.onOptionChange} />
						</FormLabel>
						<span className="jp-form-setting-explanation">
							{ __( 'Meta key example:' ) }
							&nbsp;&lt;meta name='p:domain_verify' content='<strong>f100679e6048d45e4a0b0b92dce1efce</strong>'&gt;
						</span>
					</div>

					<div className="dops-card">
						<FormLabel>
							<FormLegend>Yandex</FormLegend>
							<TextInput
								name={ 'yandex' }
								value={ this.props.getOptionValue( 'yandex' ) }
								placeholder={ 'Example: 44d68e1216009f40' }
								className="widefat code"
								disabled={ this.props.isUpdating( 'yandex' ) }
								onChange={ this.props.onOptionChange} />
						</FormLabel>
						<span className="jp-form-setting-explanation">
							{ __( 'Meta key example:' ) }
							&nbsp;&lt;meta name='yandex-verification' content='<strong>44d68e1216009f40</strong>'&gt;
						</span>
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

VerificationToolsSettings = moduleSettingsForm( VerificationToolsSettings );

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

export let AfterTheDeadlineSettings = React.createClass( {
	render() {
		return (
			<form onSubmit={ this.props.onSubmit } >
				<FormFieldset>
					<FormLegend> { __( 'Proofreading' ) } </FormLegend>
					<span className="jp-form-setting-explanation">{ __( 'Automatically proofread content when: ' ) }</span>
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
					<FormLegend> { __( 'Automatic Language Detection' ) }
					</FormLegend>
					<span className="jp-form-setting-explanation">{ __( 'The proofreader supports English, French, ' +
						'German, Portuguese and Spanish.' ) }</span>
					<ModuleSettingCheckbox
						name={ 'guess_lang' }
						{ ...this.props }
						label={ __( 'Use automatically detected language to proofread posts and pages' ) } />
				</FormFieldset>
				<FormFieldset>
					<FormLegend> { __( 'English Options' ) } </FormLegend>
					<span className="jp-form-setting-explanation">{ __( 'Enable proofreading for the following grammar and style rules: ' ) }</span>
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

AfterTheDeadlineSettings = moduleSettingsForm( AfterTheDeadlineSettings );

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

MarkdownSettings = moduleSettingsForm( MarkdownSettings );

export let SitemapsSettings = React.createClass( {
	render() {
		let sitemap_url = get( this.props, [ 'module', 'extra', 'sitemap_url' ], '' ),
			news_sitemap_url = get( this.props, [ 'module', 'extra', 'news_sitemap_url' ], '' );
		return (
			<div>
				<p>{ __( 'Search engines will find the sitemaps at these locations:' ) }</p>
				<p>{
					__( 'Sitemap: {{a}}%(url)s{{/a}}', {
						components: {
							a: <a href={ sitemap_url } target="_blank" />
						},
						args: {
							url: sitemap_url
						}
					} )
				}</p>
				<p>{
					__( 'News Sitemap: {{a}}%(url)s{{/a}}', {
						components: {
							a: <a href={ news_sitemap_url } target="_blank" />
						},
						args: {
							url: news_sitemap_url
						}
					} )
				}</p>
			</div>
		)
	}
} );

SitemapsSettings = moduleSettingsForm( SitemapsSettings );

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
