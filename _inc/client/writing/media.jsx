/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import FormToggle from 'components/form/form-toggle';

/**
 * Internal dependencies
 */
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

export const Media = moduleSettingsForm(
	React.createClass( {

		/**
		 * Get options for initial state.
		 *
		 * @returns {{carousel_display_exif: Boolean}}
		 */
		getInitialState() {
			return {
				carousel_display_exif: this.props.getOptionValue( 'carousel_display_exif', 'carousel' )
			};
		},

		/**
		 * Update state so toggles are updated.
		 *
		 * @param {string} optionName
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
			let photon   = this.props.getModule( 'photon' ),
				carousel = this.props.getModule( 'carousel' ),
				isCarouselActive = this.props.getOptionValue( 'carousel' );

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Media' ) }>
					<SettingsGroup hasChild disableInDevMode module={ photon }>
						<ModuleToggle
							slug="photon"
							compact
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
					<SettingsGroup hasChild support={ carousel.learn_more_button }>
						<ModuleToggle
							slug="carousel"
							compact
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
							<FormToggle
								compact
								checked={ this.state.carousel_display_exif }
								disabled={ ! isCarouselActive || this.props.isSavingAnyOption() }
								onChange={ e => this.updateOptions( 'carousel_display_exif' ) }>
									<span className="jp-form-toggle-explanation">
										{
											__( 'Show photo metadata (Exif) in carousel, when available' )
										}
									</span>
							</FormToggle>
							<FormLabel>
								<FormLegend className="jp-form-label-wide">{ __( 'Background color' ) }</FormLegend>
								<FormSelect
									name={ 'carousel_background_color' }
									value={ this.props.getOptionValue( 'carousel_background_color' ) }
									disabled={ ! isCarouselActive || this.props.isSavingAnyOption( 'carousel_background_color' ) }
									{ ...this.props }
									validValues={ this.props.validValues( 'carousel_background_color', 'carousel' ) }/>
							</FormLabel>
						</FormFieldset>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);
