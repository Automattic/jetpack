/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Card from 'components/card';
import CompactFormToggle from 'components/form/form-toggle/compact';
import { FormFieldset, FormLabel } from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { isBlockTheme, getLastPostUrl } from 'state/initial-state';

class RelatedPosts extends Component {
	/**
	 * Get options for initial state.
	 *
	 * @returns {{show_headline: boolean, show_thumbnails: boolean, append_to_posts: boolean}} Initial state object.
	 */
	state = {
		show_headline: this.props.getOptionValue( 'show_headline', 'related-posts' ),
		show_thumbnails: this.props.getOptionValue( 'show_thumbnails', 'related-posts' ),
		append_to_posts: this.props.getOptionValue( 'append_to_posts', 'related-posts' ),
	};

	/**
	 * Update state so preview is updated instantly and toggle options.
	 *
	 * @param {string} optionName - Slug of option to update.
	 */
	updateOptions = optionName => {
		this.setState(
			{
				[ optionName ]: ! this.state[ optionName ],
			},
			this.props.updateFormStateModuleOption( 'related-posts', optionName )
		);
	};

	handleShowHeadlineToggleChange = () => {
		this.updateOptions( 'show_headline' );
	};

	handleShowThumbnailsToggleChange = () => {
		this.updateOptions( 'show_thumbnails' );
	};

	handleAppendPostsToggleChange = () => {
		this.updateOptions( 'append_to_posts' );
	};

	trackConfigureClick = type => {
		analytics.tracks.recordJetpackClick( {
			target: 'configure-related-posts',
			type, // Classic for classic themes (customizer link), // blockTheme for block themes (site editor link).
		} );
	};

	configureLink() {
		const { siteAdminUrl, isBlockEnabledTheme, lastPostUrl } = this.props;

		// For block themes, folks will want to add the Related Posts block directly in the site editor.
		if ( isBlockEnabledTheme ) {
			return (
				<Card
					compact
					className="jp-settings-card__configure-link"
					onClick={ this.trackConfigureClick( 'blockTheme' ) }
					href={ `${ siteAdminUrl }site-editor.php` }
				>
					{ __( 'Add a Related Posts Block to your site.', 'jetpack' ) }
				</Card>
			);
		}

		const configureUrl =
			siteAdminUrl +
			'customize.php?autofocus[section]=jetpack_relatedposts' +
			'&return=' +
			encodeURIComponent( siteAdminUrl + 'admin.php?page=jetpack#/traffic' ) +
			'&url=' +
			encodeURIComponent( lastPostUrl );

		return (
			<Card
				compact
				className="jp-settings-card__configure-link"
				onClick={ this.trackConfigureClick( 'classic' ) }
				href={ configureUrl }
			>
				{ __( 'Configure related posts in the Customizer', 'jetpack' ) }
			</Card>
		);
	}

	classicRelatedPostsSettings() {
		return (
			<>
				<CompactFormToggle
					checked={ this.state.append_to_posts }
					disabled={ this.props.isSavingAnyOption( [ 'related-posts', 'append_to_posts' ] ) }
					onChange={ this.handleAppendPostsToggleChange }
				>
					<span className="jp-form-toggle-explanation">
						{ __( 'Automatically display related posts at the bottom of each post.', 'jetpack' ) }
					</span>
				</CompactFormToggle>
				{ this.state.append_to_posts && (
					<>
						<CompactFormToggle
							checked={ this.state.show_headline }
							disabled={ this.props.isSavingAnyOption( [
								'related-posts',
								'show_headline',
								'append_posts',
							] ) }
							onChange={ this.handleShowHeadlineToggleChange }
						>
							<span className="jp-form-toggle-explanation">
								{ __( 'Highlight related content with a heading', 'jetpack' ) }
							</span>
						</CompactFormToggle>
						<CompactFormToggle
							checked={ this.state.show_thumbnails }
							disabled={ this.props.isSavingAnyOption( [
								'related-posts',
								'show_thumbnails',
								'append_posts',
							] ) }
							onChange={ this.handleShowThumbnailsToggleChange }
						>
							<span className="jp-form-toggle-explanation">
								{ __( 'Show a thumbnail image where available', 'jetpack' ) }
							</span>
						</CompactFormToggle>
						{ this.relatedPostsPreview() }
					</>
				) }
			</>
		);
	}

	relatedPostsPreview() {
		const fakePosts = [
			{
				url: 'cat-blog.png',
				text: __( 'Big iPhone/iPad Update Now Available', 'jetpack' ),
				context: _x(
					'In "Mobile"',
					'It refers to the category where a post was found. Used in an example preview.',
					'jetpack'
				),
			},
			{
				url: 'devices.jpg',
				text: __( 'The WordPress for Android App Gets a Big Facelift', 'jetpack' ),
				context: _x(
					'In "Mobile"',
					'It refers to the category where a post was found. Used in an example preview.',
					'jetpack'
				),
			},
			{
				url: 'mobile-wedding.jpg',
				text: __( 'Upgrade Focus: VideoPress For Weddings', 'jetpack' ),
				context: _x(
					'In "Upgrade"',
					'It refers to the category where a post was found. Used in an example preview.',
					'jetpack'
				),
			},
		];

		return (
			<div>
				<FormLabel className="jp-form-label-wide">
					{ _x( 'Preview', 'A header for a preview area in the configuration screen.', 'jetpack' ) }
				</FormLabel>
				<Card className="jp-related-posts-preview">
					{ this.state.show_headline && (
						<div className="jp-related-posts-preview__title">{ __( 'Related', 'jetpack' ) }</div>
					) }
					{ fakePosts.map( ( item, index ) => (
						<div key={ `preview_${ index }` } className="jp-related-posts-preview__item">
							{ this.state.show_thumbnails && (
								<img
									src={ `https://jetpackme.files.wordpress.com/2019/03/${ item.url }` }
									alt={ item.text }
								/>
							) }
							<h4 className="jp-related-posts-preview__post-title">
								<a href="#/traffic">{ item.text }</a>
							</h4>
							<p className="jp-related-posts-preview__post-context">{ item.context }</p>
						</div>
					) ) }
				</Card>
			</div>
		);
	}

	render() {
		const { isBlockEnabledTheme } = this.props;

		const isRelatedPostsActive = this.props.getOptionValue( 'related-posts' ),
			unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'related-posts' );
		return (
			<SettingsCard { ...this.props } hideButton module="related-posts">
				<SettingsGroup
					hasChild
					disableInOfflineMode
					module={ this.props.getModule( 'related-posts' ) }
					support={ {
						text: __(
							'The feature helps visitors find more of your content by displaying related posts at the bottom of each post.',
							'jetpack'
						),
						link: getRedirectUrl( 'jetpack-support-related-posts' ),
					} }
				>
					<p>
						{ createInterpolateElement(
							__(
								'Keep your visitors engaged with related content at the bottom of each post, or anywhere within your content thanks to the <a>Related Posts Block</a>.',
								'jetpack'
							),
							{
								a: (
									<a
										href={ getRedirectUrl( 'jetpack-support-jetpack-blocks-related-posts-block' ) }
										target="_blank"
										rel="noopener noreferrer"
									/>
								),
							}
						) }
					</p>
					<ModuleToggle
						slug="related-posts"
						disabled={ unavailableInOfflineMode }
						activated={ isRelatedPostsActive }
						toggling={ this.props.isSavingAnyOption( 'related-posts' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{ __( 'Show related content for each one of your posts.', 'jetpack' ) }
						</span>
					</ModuleToggle>
					{ isRelatedPostsActive && (
						<FormFieldset>
							{ ! isBlockEnabledTheme &&
								! unavailableInOfflineMode &&
								this.classicRelatedPostsSettings() }
						</FormFieldset>
					) }
				</SettingsGroup>
				{ ! unavailableInOfflineMode && isRelatedPostsActive && this.configureLink() }
			</SettingsCard>
		);
	}
}

export default connect( state => {
	return {
		isBlockEnabledTheme: isBlockTheme( state ),
		lastPostUrl: getLastPostUrl( state ),
	};
} )( withModuleSettingsFormHelpers( RelatedPosts ) );
