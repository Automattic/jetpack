/**
 * External dependencies
 */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import CompactFormToggle from 'components/form/form-toggle/compact';
import getRedirectUrl from 'lib/jp-redirect';

/**
 * Internal dependencies
 */
import { FormFieldset, FormLegend, FormLabel, FormSelect } from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { getModule } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';

class WritingMedia extends Component {
	/**
	 * Get options for initial state.
	 *
	 * @returns {Object} {{carousel_display_exif: Boolean}}
	 */
	state = {
		carousel_display_exif: this.props.getOptionValue( 'carousel_display_exif', 'carousel' ),
	};

	/**
	 * Update state so toggles are updated.
	 *
	 * @param {string} optionName option slug
	 */
	updateOptions = optionName => {
		this.setState(
			{
				[ optionName ]: ! this.state[ optionName ],
			},
			this.props.updateFormStateModuleOption( 'carousel', optionName )
		);
	};

	handleCarouselDisplayExifChange = () => {
		this.updateOptions( 'carousel_display_exif' );
	};

	render() {
		const foundCarousel = this.props.isModuleFound( 'carousel' );

		if ( ! foundCarousel ) {
			return null;
		}

		const isCarouselActive = this.props.getOptionValue( 'carousel' );

		return (
			<SettingsCard
				{ ...this.props }
				module="media"
				header={ __( 'Media' ) }
				hideButton={ ! foundCarousel }
				saveDisabled={ this.props.isSavingAnyOption( 'carousel_background_color' ) }
			>
				<SettingsGroup
					hasChild
					module={ { module: 'carousel' } }
					support={ {
						link: getRedirectUrl( 'jetpack-support-carousel' ),
					} }
				>
					<p>
						{ __(
							'Create full-screen carousel slideshows for the images in your ' +
								'posts and pages. Carousel galleries are mobile-friendly and ' +
								'encourage site visitors to interact with your photos.'
						) }
					</p>
					<ModuleToggle
						slug="carousel"
						activated={ isCarouselActive }
						toggling={ this.props.isSavingAnyOption( 'carousel' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{ __( 'Display images in a full-screen carousel gallery' ) }
						</span>
					</ModuleToggle>
					<FormFieldset>
						<CompactFormToggle
							checked={ this.state.carousel_display_exif }
							disabled={
								! isCarouselActive ||
								this.props.isSavingAnyOption( [ 'carousel', 'carousel_display_exif' ] )
							}
							onChange={ this.handleCarouselDisplayExifChange }
						>
							<span className="jp-form-toggle-explanation">
								{ __( 'Show photo Exif metadata in carousel (when available)' ) }
							</span>
						</CompactFormToggle>
						<FormFieldset>
							<p className="jp-form-setting-explanation">
								{ __(
									'Exif data shows viewers additional technical details of a photo, like its focal length, aperture, and ISO.'
								) }
							</p>
						</FormFieldset>
						<FormLabel>
							<FormLegend className="jp-form-label-wide">
								{ __( 'Carousel color scheme' ) }
							</FormLegend>
							<FormSelect
								name={ 'carousel_background_color' }
								value={ this.props.getOptionValue( 'carousel_background_color' ) }
								disabled={
									! isCarouselActive ||
									this.props.isSavingAnyOption( [ 'carousel', 'carousel_background_color' ] )
								}
								{ ...this.props }
								validValues={ this.props.validValues( 'carousel_background_color', 'carousel' ) }
							/>
						</FormLabel>
					</FormFieldset>
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
		isModuleFound: module_name => _isModuleFound( state, module_name ),
	};
} )( withModuleSettingsFormHelpers( WritingMedia ) );
