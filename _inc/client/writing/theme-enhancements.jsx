/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import CompactFormToggle from 'components/form/form-toggle/compact';

/**
 * Internal dependencies
 */
import { FormFieldset } from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import { getModule } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

const ThemeEnhancements = moduleSettingsForm(
	React.createClass( {

		/**
		 * Get options for initial state.
		 *
		 * @returns {Object} {{
		 * infinite_scroll: *,
		*		infinite_scroll_google_analytics: *,
		*		wp_mobile_excerpt: *,
		*		wp_mobile_featured_images: *,
		*		wp_mobile_app_promos: *
		 * }}
		 */
		getInitialState() {
			return {
				infinite_scroll: this.props.getOptionValue( 'infinite_scroll', 'infinite-scroll' ),
				infinite_scroll_google_analytics: this.props.getOptionValue( 'infinite_scroll_google_analytics', 'infinite-scroll' ),
				wp_mobile_excerpt: this.props.getOptionValue( 'wp_mobile_excerpt', 'minileven' ),
				wp_mobile_featured_images: this.props.getOptionValue( 'wp_mobile_featured_images', 'minileven' ),
				wp_mobile_app_promos: this.props.getOptionValue( 'wp_mobile_app_promos', 'minileven' )
			};
		},

		/**
		 * Update state so toggles are updated.
		 *
		 * @param {string} optionName option slug
		 * @param {string} module module slug
		 */
		updateOptions( optionName, module ) {
			this.setState(
				{
					[ optionName ]: ! this.state[ optionName ]
				},
				this.props.updateFormStateModuleOption( module, optionName )
			);
		},

		render() {
			if (
				! this.props.isModuleFound( 'infinite-scroll' )
				&& ! this.props.isModuleFound( 'minileven' )
			) {
				return null;
			}

			return (
				<SettingsCard
					isSavingAnyOption={ this.props.isSavingAnyOption }
					hideButton
					header={ __( 'Theme enhancements' ) }>
					{

						[
							{
								...this.props.getModule( 'infinite-scroll' ),
								checkboxes: [
									{
										key: 'infinite_scroll',
										label: __( 'Scroll infinitely (Shows 7 posts on each load)' )
									},
									{
										key: 'infinite_scroll_google_analytics',
										label: __( 'Track each scroll load (7 posts by default) as a page view in Google Analytics' )
									}
								]
							},
							{
								...this.props.getModule( 'minileven' ),
								checkboxes: [
									{
										key: 'wp_mobile_excerpt',
										label: __( 'Use excerpts instead of full posts on front page and archive pages' )
									},
									{
										key: 'wp_mobile_featured_images',
										label: __( 'Show featured images' )
									},
									{
										key: 'wp_mobile_app_promos',
										label: __( 'Show an ad for the WordPress mobile apps in the footer of the mobile theme' )
									}
								]
							}
						].map( item => {
							let isItemActive = this.props.getOptionValue( item.module );

							if ( ! this.props.isModuleFound( item.module ) ) {
								return null;
							}

							return (
								<SettingsGroup hasChild key={ `theme_enhancement_${ item.module }` } support={ item.learn_more_button }>
									<ModuleToggle
										slug={ item.module }
										activated={ isItemActive }
										toggling={ this.props.isSavingAnyOption( item.module ) }
										toggleModule={ this.props.toggleModuleNow }
									>
									<span className="jp-form-toggle-explanation">
									{
										item.description
									}
									</span>
									</ModuleToggle>
									<FormFieldset>
										{
											item.checkboxes.map( chkbx => {
												return (
													<CompactFormToggle
														checked={ this.state[ chkbx.key ] }
														disabled={ ! isItemActive }
														onChange={ () => this.updateOptions( chkbx.key, item.module ) }
														key={ `${ item.module }_${ chkbx.key }`}>
														<span className="jp-form-toggle-explanation">
															{
																chkbx.label
															}
														</span>
													</CompactFormToggle>
												);
											} )
										}
									</FormFieldset>
								</SettingsGroup>
							);
						} )
					}
				</SettingsCard>
			);
		}
	} )
);

export default connect(
	( state ) => {
		return {
			module: ( module_name ) => getModule( state, module_name ),
			isModuleFound: ( module_name ) => _isModuleFound( state, module_name )
		}
	}
)( ThemeEnhancements );
