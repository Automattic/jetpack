/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import CompactFormToggle from 'components/form/form-toggle/compact';
import includes from 'lodash/includes';

/**
 * Internal dependencies
 */
import { FormFieldset, FormLabel, FormLegend } from 'components/forms';
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
		 * 		infinite_scroll: *,
		 *		wp_mobile_excerpt: *,
		 *		wp_mobile_featured_images: *,
		 *		wp_mobile_app_promos: *
		 * }}
		 */
		getInitialState() {
			return {
				infinite_mode: this.getInfiniteMode(),
				wp_mobile_excerpt: this.props.getOptionValue( 'wp_mobile_excerpt' ),
				wp_mobile_featured_images: this.props.getOptionValue( 'wp_mobile_featured_images' ),
				wp_mobile_app_promos: this.props.getOptionValue( 'wp_mobile_app_promos' )
			};
		},

		/**
		 * Translate Infinite Scroll module and option status into our three values for the options.
		 *
		 * @returns {string}
		 */
		getInfiniteMode() {
			if ( ! this.props.getOptionValue( 'infinite-scroll' ) ) {
				return 'infinite_default';
			}
			if ( this.props.getOptionValue( 'infinite_scroll', 'infinite-scroll' ) ) {
				return 'infinite_scroll';
			}
			return 'infinite_button';
		},

		/**
		 * Update the state for infinite scroll options and prepare options to submit
		 *
		 * @param {string} radio
		 */
		updateInfiniteMode( radio ) {
			this.setState(
				{
					infinite_mode: radio
				},
				this.prepareOptionsToUpdate
			);
		},

		/**
		 * Update the options that will be submitted to translate from the three radios to the module and option status.
		 */
		prepareOptionsToUpdate() {
			if ( 'infinite_default' === this.state.infinite_mode ) {
				this.props.updateFormStateOptionValue( 'infinite-scroll', false );
			} else if ( 'infinite_scroll' === this.state.infinite_mode || 'infinite_button' === this.state.infinite_mode ) {
				this.props.updateFormStateOptionValue( {
					'infinite-scroll': true,
					infinite_scroll: 'infinite_scroll' === this.state.infinite_mode
				} );
			}
		},

		translateBooleanValue( optionName ) {
			return includes( [ 'enabled', '1' ], this.state[ optionName ] ) || true === this.state[ optionName ];
		},

		/**
		 * Update state so toggles are updated.
		 *
		 * @param {string} optionName option slug
		 */
		updateOptions( optionName ) {
			const booleanValue = this.translateBooleanValue( optionName );
			this.setState(
				{
					[ optionName ]: ! booleanValue
				}
			);
			this.props.updateOptions( {
				[ optionName ]: booleanValue
					? 'disabled'
					: 'enabled'
			} );
		},

		render() {
			if ( ! this.props.isModuleFound( 'infinite-scroll' ) && ! this.props.isModuleFound( 'minileven' ) ) {
				return null;
			}

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Theme enhancements' ) }>
					{
						[ {
							...this.props.getModule( 'infinite-scroll' ),
							radios: [
								{
									key: 'infinite_default',
									label: __( 'Load more posts using the default theme behavior' )
								},
								{
									key: 'infinite_button',
									label: __( 'Load more posts in page with a button' )
								},
								{
									key: 'infinite_scroll',
									label: __( 'Load more posts as the reader scrolls down' )
								}
							]
						} ].map( item => {
							if ( ! this.props.isModuleFound( item.module ) ) {
								return null;
							}

							return (
								<SettingsGroup hasChild key={ `theme_enhancement_${ item.module }` } support={ item.learn_more_button }>
									<FormLegend className="jp-form-label-wide">
										{
											item.name
										}
									</FormLegend>
									{
										item.radios.map( radio => {
											return (
												<FormLabel key={ `${ item.module }_${ radio.key }` }>
													<input
														type="radio"
														name="infinite_mode"
														value={ radio.key }
														checked={ radio.key === this.state.infinite_mode }
														disabled={ this.props.isSavingAnyOption( [ item.module, radio.key ] ) }
														onChange={ () => this.updateInfiniteMode( radio.key ) }
													/>
													<span className="jp-form-toggle-explanation">
														{
															radio.label
														}
													</span>
												</FormLabel>
											);
										} )
									}
								</SettingsGroup>
							);
						} )
					}
					{
						[ {
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
						} ].map( item => {
							const isItemActive = this.props.getOptionValue( item.module );

							if ( ! this.props.isModuleFound( item.module ) ) {
								return null;
							}

							return (
								<SettingsGroup hasChild key={ `theme_enhancement_${ item.module }` } support={ item.learn_more_button }>
									{
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
									}
									<FormFieldset>
										{
											item.checkboxes.map( chkbx => {
												return (
													<CompactFormToggle
														checked={ this.translateBooleanValue( chkbx.key ) }
														disabled={ ! isItemActive || this.props.isSavingAnyOption( [ item.module, chkbx.key ] ) }
														onChange={ () => this.updateOptions( chkbx.key ) }
														key={ `${ item.module }_${ chkbx.key }` }>
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
		};
	}
)( ThemeEnhancements );
