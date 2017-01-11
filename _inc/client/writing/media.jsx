/**
 * External dependencies
 */
import analytics from 'lib/analytics';
import React from 'react';
import { translate as __ } from 'i18n-calypso';

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
import { ModuleSettingCheckbox } from 'components/module-settings/form-components';
import SettingsCard from 'components/settings-card';

export const Media = moduleSettingsForm(
	React.createClass( {

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
					<ModuleToggle slug="photon"
								  compact
								  activated={ this.props.getOptionValue( 'photon' ) }
								  toggling={ this.props.isSavingAnyOption( 'photon' ) }
								  toggleModule={ this.toggleModule }>
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
					<ModuleToggle slug="carousel"
								  compact
								  activated={ isCarouselActive }
								  toggling={ this.props.isSavingAnyOption( 'carousel' ) }
								  toggleModule={ this.props.toggleModuleNow }>
								<span className="jp-form-toggle-explanation">
									{
										carousel.description
									}
								</span>
					</ModuleToggle>
					{
						isCarouselActive
							? <FormFieldset support={ carousel.learn_more_button }>
								<ModuleSettingCheckbox
									name={ 'carousel_display_exif' }
									{ ...this.props }
									label={ __( 'Show photo metadata (Exif) in carousel, when available' ) } />
								<FormLabel>
									<FormLegend className="jp-form-label-wide">{ __( 'Background color' ) }</FormLegend>
									<FormSelect
										name={ 'carousel_background_color' }
										value={ this.props.getOptionValue( 'carousel_background_color' ) }
										{ ...this.props }
										validValues={ this.props.validValues( 'carousel_background_color', 'carousel' ) }/>
								</FormLabel>
							  </FormFieldset>
							: ''
					}
				</SettingsCard>
			);
		}
	} )
);
