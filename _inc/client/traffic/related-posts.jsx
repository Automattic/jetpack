/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import ExternalLink from 'components/external-link';
import Card from 'components/card';
import CompactFormToggle from 'components/form/form-toggle/compact';

/**
 * Internal dependencies
 */
import {
	FormFieldset,
	FormLabel
} from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

class RelatedPostsComponent extends React.Component {
    /**
	 * Get options for initial state.
	 *
	 * @returns {{show_headline: Boolean, show_thumbnails: Boolean}} Initial state object.
	 */
	state = {
		show_headline: this.props.getOptionValue( 'show_headline', 'related-posts' ),
		show_thumbnails: this.props.getOptionValue( 'show_thumbnails', 'related-posts' )
	};

	/**
	 * Update state so preview is updated instantly and toggle options.
	 *
	 * @param {string} optionName Slug of option to update.
	 */
	updateOptions = optionName => {
		this.setState(
			{
				[ optionName ]: ! this.state[ optionName ]
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

	render() {
		const isRelatedPostsActive = this.props.getOptionValue( 'related-posts' ),
			unavailableInDevMode = this.props.isUnavailableInDevMode( 'related-posts' );
		return (
			<SettingsCard
				{ ...this.props }
				hideButton
				module="related-posts">
				<SettingsGroup
					hasChild
					disableInDevMode
					module={ this.props.getModule( 'related-posts' ) }
					support={ {
						text: __( 'Automatically displays similar content at the end of each post.' ),
						link: 'https://jetpack.com/support/related-posts/',
					} }
					>
					<ModuleToggle
						slug="related-posts"
						disabled={ unavailableInDevMode }
						activated={ isRelatedPostsActive }
						toggling={ this.props.isSavingAnyOption( 'related-posts' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
					<span className="jp-form-toggle-explanation">
						{
							__( 'Show related content after posts' )
						}
					</span>
					</ModuleToggle>
					<FormFieldset>
						<CompactFormToggle
									checked={ this.state.show_headline }
									disabled={ ! isRelatedPostsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'related-posts', 'show_headline' ] ) }
									onChange={ this.handleShowHeadlineToggleChange }>
									<span className="jp-form-toggle-explanation">
										{
											__( 'Show a "Related" header to more clearly separate the related section from posts' )
										}
									</span>
						</CompactFormToggle>
						<CompactFormToggle
									checked={ this.state.show_thumbnails }
									disabled={ ! isRelatedPostsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'related-posts', 'show_thumbnails' ] ) }
									onChange={ this.handleShowThumbnailsToggleChange }>
									<span className="jp-form-toggle-explanation">
										{
											__( 'Use a large and visually striking layout' )
										}
									</span>
						</CompactFormToggle>
						{
							__( '{{span}}You can now also configure related posts in the Customizer. {{ExternalLink}}Try it out!{{/ExternalLink}}{{/span}}', {
								components: {
									span: <span className="jp-form-setting-explanation" />,
									ExternalLink: <ExternalLink
										className="jp-module-settings__external-link"
										href={ this.props.configureUrl } />
								}
							} )
						}
						<FormLabel className="jp-form-label-wide">
							{ __( 'Preview', { context: 'A header for a preview area in the configuration screen.' } ) }
						</FormLabel>
						<Card className="jp-related-posts-preview">
							{
								this.state.show_headline && (
									<div className="jp-related-posts-preview__title">{ __( 'Related' ) }</div>
								)
							}
							{
								[
									{
										url: '1-wpios-ipad-3-1-viewsite.png',
										text: __( 'Big iPhone/iPad Update Now Available' ),
										context: __( 'In "Mobile"', {
											comment: 'It refers to the category where a post was found. Used in an example preview.'
										} )
									},
									{
										url: 'wordpress-com-news-wordpress-for-android-ui-update2.jpg',
										text: __( 'The WordPress for Android App Gets a Big Facelift' ),
										context: __( 'In "Mobile"', {
											comment: 'It refers to the category where a post was found. Used in an example preview.'
										} )
									},
									{
										url: 'videopresswedding.jpg',
										text: __( 'Upgrade Focus: VideoPress For Weddings' ),
										context: __( 'In "Upgrade"', {
											comment: 'It refers to the category where a post was found. Used in an example preview.'
										} )
									}
								].map( ( item, index ) => (
									<div key={ `preview_${ index }` } className="jp-related-posts-preview__item">
										{
											this.state.show_thumbnails && (
												<img src={ `https://jetpackme.files.wordpress.com/2014/08/${ item.url }?w=350&h=200&crop=1` } alt={ item.text } />
											)
										}
										<h4 className="jp-related-posts-preview__post-title"><a href="#/traffic">{ item.text }</a></h4>
										<p className="jp-related-posts-preview__post-context">
											{ item.context }
										</p>
									</div>
								) )
							}
						</Card>
					</FormFieldset>
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

export const RelatedPosts = moduleSettingsForm( RelatedPostsComponent );
