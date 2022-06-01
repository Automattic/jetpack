import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import Card from 'components/card';
import CompactFormToggle from 'components/form/form-toggle/compact';
import { FormFieldset, FormLabel } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import React from 'react';

class RelatedPostsComponent extends React.Component {
	/**
	 * Get options for initial state.
	 *
	 * @returns {{show_headline: Boolean, show_thumbnails: Boolean}} Initial state object.
	 */
	state = {
		show_headline: this.props.getOptionValue( 'show_headline', 'related-posts' ),
		show_thumbnails: this.props.getOptionValue( 'show_thumbnails', 'related-posts' ),
	};

	/**
	 * Update state so preview is updated instantly and toggle options.
	 *
	 * @param {string} optionName Slug of option to update.
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

	trackConfigureClick = () => {
		analytics.tracks.recordJetpackClick( 'configure-related-posts' );
	};

	render() {
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
								'Keep your visitors engaged with related content at the bottom of each post. These settings won’t apply to <a>related posts added using the block editor</a>.',
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
							{ __( 'Show related content after posts', 'jetpack' ) }
						</span>
					</ModuleToggle>
					<FormFieldset>
						<CompactFormToggle
							checked={ this.state.show_headline }
							disabled={
								! isRelatedPostsActive ||
								unavailableInOfflineMode ||
								this.props.isSavingAnyOption( [ 'related-posts', 'show_headline' ] )
							}
							onChange={ this.handleShowHeadlineToggleChange }
						>
							<span className="jp-form-toggle-explanation">
								{ __( 'Highlight related content with a heading', 'jetpack' ) }
							</span>
						</CompactFormToggle>
						<CompactFormToggle
							checked={ this.state.show_thumbnails }
							disabled={
								! isRelatedPostsActive ||
								unavailableInOfflineMode ||
								this.props.isSavingAnyOption( [ 'related-posts', 'show_thumbnails' ] )
							}
							onChange={ this.handleShowThumbnailsToggleChange }
						>
							<span className="jp-form-toggle-explanation">
								{ __( 'Show a thumbnail image where available', 'jetpack' ) }
							</span>
						</CompactFormToggle>
						{ isRelatedPostsActive && (
							<div>
								<FormLabel className="jp-form-label-wide">
									{ _x(
										'Preview',
										'A header for a preview area in the configuration screen.',
										'jetpack'
									) }
								</FormLabel>
								<Card className="jp-related-posts-preview">
									{ this.state.show_headline && (
										<div className="jp-related-posts-preview__title">
											{ __( 'Related', 'jetpack' ) }
										</div>
									) }
									{ [
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
									].map( ( item, index ) => (
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
						) }
					</FormFieldset>
				</SettingsGroup>
				{ ! this.props.isUnavailableInOfflineMode( 'related-posts' ) && isRelatedPostsActive && (
					<Card
						compact
						className="jp-settings-card__configure-link"
						onClick={ this.trackConfigureClick }
						href={ this.props.configureUrl }
					>
						{ __( 'Configure related posts in the Customizer', 'jetpack' ) }
					</Card>
				) }
			</SettingsCard>
		);
	}
}

export const RelatedPosts = withModuleSettingsFormHelpers( RelatedPostsComponent );
