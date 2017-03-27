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
import {
	FEATURE_VIDEO_HOSTING_JETPACK,
	getPlanClass
} from 'lib/plans/constants';
import {
	FormFieldset,
	FormLegend,
	FormLabel,
	FormSelect
} from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { getModule } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';
import { getSitePlan } from 'state/site';

const Media = moduleSettingsForm(
	React.createClass( {

		/**
		 * Get options for initial state.
		 *
		 * @returns {Object} {{carousel_display_exif: Boolean}}
		 */
		getInitialState() {
			return {
				carousel_display_exif: this.props.getOptionValue( 'carousel_display_exif', 'carousel' )
			};
		},

		/**
		 * Update state so toggles are updated.
		 *
		 * @param {string} optionName option slug
		 */
		updateOptions( optionName ) {
			this.setState(
				{
					[ optionName ]: ! this.state[ optionName ]
				},
				this.props.updateFormStateModuleOption( 'carousel', optionName )
			);
		},

		toggleModule( name, value ) {
			if ( 'photon' === name ) {
				// Carousel depends on Photon. Deactivate it if Photon is deactivated.
				if ( false === ! value ) {
					this.props.updateOptions( { photon: false, 'tiled-gallery': false, tiled_galleries: false } );
				} else {
					this.props.updateOptions( { photon: true, 'tiled-gallery': true, tiled_galleries: true } );
				}
			} else {
				this.props.updateFormStateOptionValue( name, ! value );
			}
		},

		render() {
			if (
				! this.props.isModuleFound( 'photon' ) &&
				! this.props.isModuleFound( 'carousel' )
			) {
				// Nothing to show here
				return null;
			}

			const photon = this.props.module( 'photon' ),
				carousel = this.props.module( 'carousel' ),
				isCarouselActive = this.props.getOptionValue( 'carousel' ),
				videoPress = this.props.module( 'videopress' ),
				planClass = getPlanClass( this.props.sitePlan.product_slug );

			const photonSettings = (
				<SettingsGroup
					hasChild
					disableInDevMode
					module={ photon }>
					<ModuleToggle
						slug="photon"
						disabled={ this.props.isUnavailableInDevMode( 'photon' ) }
						activated={ this.props.getOptionValue( 'photon' ) }
						toggling={ this.props.isSavingAnyOption( 'photon' ) }
						toggleModule={ this.toggleModule }
					>
						<span className="jp-form-toggle-explanation">
							{
								photon.description
							}
						</span>
					</ModuleToggle>
					<FormFieldset>
						<span className="jp-form-setting-explanation">
							{
								__( 'Must be enabled to use tiled galleries.' )
							}
						</span>
					</FormFieldset>
				</SettingsGroup>
			);

			const carouselSettings = (
				<SettingsGroup module={ { module: 'carousel' } } hasChild support={ carousel.learn_more_button }>
					<ModuleToggle
						slug="carousel"
						activated={ isCarouselActive }
						toggling={ this.props.isSavingAnyOption( 'carousel' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{
								carousel.description
							}
						</span>
					</ModuleToggle>
					<FormFieldset>
						<CompactFormToggle
							checked={ this.state.carousel_display_exif }
							disabled={ ! isCarouselActive || this.props.isSavingAnyOption( [ 'carousel', 'carousel_display_exif' ] ) }
							onChange={ () => this.updateOptions( 'carousel_display_exif' ) }>
							<span className="jp-form-toggle-explanation">
								{
									__( 'Show photo metadata (Exif) in carousel, when available' )
								}
							</span>
						</CompactFormToggle>
						<FormLabel>
							<FormLegend className="jp-form-label-wide">
								{ __( 'Color scheme' ) }
							</FormLegend>
							<FormSelect
								name={ 'carousel_background_color' }
								value={ this.props.getOptionValue( 'carousel_background_color' ) }
								disabled={ ! isCarouselActive || this.props.isSavingAnyOption( [ 'carousel', 'carousel_background_color' ] ) }
								{ ...this.props }
								validValues={ this.props.validValues( 'carousel_background_color', 'carousel' ) } />
						</FormLabel>
					</FormFieldset>
				</SettingsGroup>
			);

			const videoPressSettings = includes( [ 'is-premium-plan', 'is-business-plan' ], planClass ) && (
				<SettingsGroup
					hasChild
					disableInDevMode
					module={ videoPress }>
					<ModuleToggle
						slug="videopress"
						disabled={ this.props.isUnavailableInDevMode( 'videopress' ) }
						activated={ this.props.getOptionValue( 'videopress' ) }
						toggling={ this.props.isSavingAnyOption( 'videopress' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{
								videoPress.description
							}
						</span>
					</ModuleToggle>
				</SettingsGroup>
			);

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Media' ) }
					feature={ FEATURE_VIDEO_HOSTING_JETPACK }
					saveDisabled={ this.props.isSavingAnyOption( 'carousel_background_color' ) }
				>
					{ this.props.isModuleFound( 'photon' ) && photonSettings }
					{ this.props.isModuleFound( 'carousel' ) && carouselSettings }
					{ this.props.isModuleFound( 'videopress' ) && videoPressSettings }
				</SettingsCard>
			);
		}
	} )
);

export default connect(
	( state ) => {
		return {
			module: ( module_name ) => getModule( state, module_name ),
			isModuleFound: ( module_name ) => _isModuleFound( state, module_name ),
			sitePlan: getSitePlan( state )
		};
	}
)( Media );
