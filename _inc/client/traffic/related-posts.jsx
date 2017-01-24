/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import ExternalLink from 'components/external-link';
import Card from 'components/card';
import FormToggle from 'components/form/form-toggle';

/**
 * Internal dependencies
 */
import {
	FormFieldset
} from 'components/forms';
import { ModuleSettingCheckbox } from 'components/module-settings/form-components';
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import {
	SettingsCard,
	SettingsGroup
} from 'components/settings-card';

export const RelatedPosts = moduleSettingsForm(
	React.createClass( {

		/**
		 * Get options for initial state.
		 *
		 * @returns {{show_headline: Boolean, show_thumbnails: Boolean}}
		 */
		getInitialState() {
			return {
				show_headline:   this.props.getOptionValue( 'show_headline', 'related-posts' ),
				show_thumbnails: this.props.getOptionValue( 'show_thumbnails', 'related-posts' )
			};
		},

		/**
		 * Update state so preview is updated instantly and toggle options.
		 *
		 * @param optionName
		 */
		updateOptions( optionName ) {
			this.setState(
				{
					[ optionName ]: ! this.state[ optionName ]
				},
				this.props.updateFormStateModuleOption( 'related-posts', optionName )
			);
		},

		render() {
			let isRelatedPostsActive = this.props.getOptionValue( 'related-posts' );
			return (
				<SettingsCard
					{ ...this.props }
					hideButton
					module="related-posts">
					<SettingsGroup hasChild support={ this.props.getModule( 'related-posts' ).learn_more_button }>
						<ModuleToggle slug="related-posts"
									  compact
									  activated={ isRelatedPostsActive }
									  toggling={ this.props.isSavingAnyOption( 'related-posts' ) }
									  toggleModule={ this.props.toggleModuleNow }>
						<span className="jp-form-toggle-explanation">
							{
								__( 'Show related content after posts.' )
							}
						</span>
						</ModuleToggle>
						{
							// Only show controls if Related Posts module:
							// - is active and it's not being toggled off
							// - is inactive and it's being toggled on.
							( isRelatedPostsActive && ! this.props.isSavingAnyOption( 'related-posts' ) ) ||
							( ! isRelatedPostsActive && this.props.isSavingAnyOption( 'related-posts' ) )
								? <FormFieldset>
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
								<FormToggle compact
											checked={ this.state.show_headline }
											disabled={ this.props.isSavingAnyOption() }
											onChange={ e => this.updateOptions( 'show_headline' ) }>
									<span className="jp-form-toggle-explanation">
										{
											__( 'Show a "Related" header to more clearly separate the related section from posts' )
										}
									</span>
								</FormToggle>
								<br />
								<FormToggle compact
											checked={ this.state.show_thumbnails }
											disabled={ this.props.isSavingAnyOption() }
											onChange={ e => this.updateOptions( 'show_thumbnails' ) }>
									<span className="jp-form-toggle-explanation">
										{
											__( 'Use a large and visually striking layout' )
										}
									</span>
								</FormToggle>
								<Card className="jp-related-posts-preview">
									{
										this.state.show_headline
											? <div className="jp-related-posts-preview__title">{ __( 'Related' ) }</div>
											: ''
									}
									{
										[
											{
												url : '1-wpios-ipad-3-1-viewsite.png',
												text: __( 'Big iPhone/iPad Update Now Available' )
											},
											{
												url : 'wordpress-com-news-wordpress-for-android-ui-update2.jpg',
												text: __( 'The WordPress for Android App Gets a Big Facelift' )
											},
											{
												url : 'videopresswedding.jpg',
												text: __( 'Upgrade Focus: VideoPress For Weddings' )
											}
										].map( ( item, index ) => (
											<span key={ `preview_${ index }` } className="jp-related-posts-preview__item">
												{
													this.state.show_thumbnails
														? <img src={ `https://jetpackme.files.wordpress.com/2014/08/${ item.url }?w=350&h=200&crop=1` } />
														: ''
												}
												<span><a href="#/traffic">{ item.text }</a></span>
											</span>
										) )
									}
								</Card>
							</FormFieldset>
								: ''
						}
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);
