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
import { FEATURE_VIDEO_HOSTING_JETPACK } from 'lib/plans/constants';
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
				this.props.updateFormStateOptionValue( name, !value );
			}
		},

		render() {
			if (
				! this.props.isModuleFound( 'photon' )
				&& ! this.props.isModuleFound( 'carousel' )
			) {
				// Nothing to show here
				return null;
			}

			let photon = this.props.module( 'photon' ),
				carousel = this.props.module( 'carousel' ),
				isCarouselActive = this.props.getOptionValue( 'carousel' );

			let photonSettings = (
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
					<span className="jp-form-setting-explanation">
						{
							__( 'Enabling Photon is required to use Tiled Galleries.' )
						}
					</span>
				</SettingsGroup>
			);

			let carouselSettings = (
				<SettingsGroup hasChild support={ carousel.learn_more_button }>
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
							disabled={ ! isCarouselActive || this.props.isSavingAnyOption() }
							onChange={ () => this.updateOptions( 'carousel_display_exif' ) }>
							<span className="jp-form-toggle-explanation">
								{
									__( 'Show photo metadata (Exif) in carousel, when available' )
								}
							</span>
						</CompactFormToggle>
						<FormLabel>
							<FormLegend className="jp-form-label-wide">
								{ __( 'Background color' ) }
							</FormLegend>
							<FormSelect
								name={ 'carousel_background_color' }
								value={ this.props.getOptionValue( 'carousel_background_color' ) }
								disabled={ ! isCarouselActive || this.props.isSavingAnyOption( 'carousel_background_color' ) }
								{ ...this.props }
								validValues={ this.props.validValues( 'carousel_background_color', 'carousel' ) }/>
						</FormLabel>
					</FormFieldset>
				</SettingsGroup>
			);

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Media' ) }
					feature={ FEATURE_VIDEO_HOSTING_JETPACK }>
					{ this.props.isModuleFound( 'photon' ) && photonSettings }
					{ this.props.isModuleFound( 'carousel' ) && carouselSettings }
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
)( Media );
