/**
 * External dependencies
 */
import analytics from 'lib/analytics';
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import TextInput from 'components/text-input';

/**
 * Internal dependencies
 */
import {
	FormFieldset,
	FormLegend,
	FormLabel
} from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { ModuleSettingSelect, ModuleSettingCheckbox } from 'components/module-settings/form-components';
import SettingsCard from 'components/settings-card';

export const Media = moduleSettingsForm(
	React.createClass( {

		toggleModule( name, value ) {
			if ( 'photon' === name ) {

				// Carousel depends on Photon. Deactivate it if Photon is deactivated.
				this.props.updateFormStateOptionValue( false === ! value
					? { photon: false, 'tiled-gallery': false, tiled_galleries: false }
					: { photon: true, 'tiled-gallery': true, tiled_galleries: true }
				);
			} else {
				this.props.updateFormStateOptionValue( name, !value );
			}
		},

		render() {
			let photon   = this.props.getModule( 'photon' ),
				carousel = this.props.getModule( 'carousel' );

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Media' ) }>
					<FormFieldset support={ photon.learn_more_button }>
						<ModuleToggle slug={ 'photon' }
									  compact
									  activated={ this.props.getOptionValue( 'photon' ) }
									  toggling={ this.props.isSavingAnyOption() }
									  toggleModule={ this.toggleModule }>
							<span className="jp-form-toggle-explanation">
								{
									photon.description
								}
							</span>
							<span className="jp-form-setting-explanation">
								{
									__( 'Enabling Photon is required to use Tiled Galleries.' )
								}
							</span>
						</ModuleToggle>
					</FormFieldset>
					<hr />
					<ModuleToggle slug={ 'carousel' }
								  compact
								  activated={ this.props.getOptionValue( 'carousel' ) }
								  toggleModule={ this.toggleModule }>
								<span className="jp-form-toggle-explanation">
									{
										carousel.description
									}
								</span>
					</ModuleToggle>
					{
						this.props.getSettingCurrentValue( 'carousel' )
							? <FormFieldset support={ carousel.learn_more_button }>
							<ModuleSettingCheckbox
								name={ 'carousel_display_exif' }
								{ ...this.props }
								label={ __( 'Show photo metadata (Exif) in carousel, when available' ) } />
							<FormLabel>
								<span className="jp-form-label-wide">{ __( 'Background color' ) }</span>
								<ModuleSettingSelect
									name={ 'carousel_background_color' }
									value={ this.props.getOptionValue( 'carousel_background_color' ) }
									onChange={ this.props.onOptionChange }
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
