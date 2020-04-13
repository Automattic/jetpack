/**
 * External dependencies
 */

import React, { useState } from 'react';
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

/**
 * Renders controls to activate the carousel and additional settings.
 *
 * @param {object} props - Component properties.
 *
 * @returns {object} - Controls for carousel.
 */
function WritingMedia( props ) {
	const [ displayExif, setDisplayExif ] = useState(
		props.getOptionValue( 'carousel_display_exif', 'carousel' )
	);
	const [ displayComments, setDisplayComments ] = useState(
		props.getOptionValue( 'carousel_display_comments', 'carousel' )
	);

	const handleCarouselDisplayExifChange = () => {
		setDisplayExif( ! displayExif );
		props.updateFormStateModuleOption( 'carousel', 'carousel_display_exif' );
	};

	const handleCarouselDisplayCommentsChange = () => {
		setDisplayComments( ! displayComments );
		props.updateFormStateModuleOption( 'carousel', 'carousel_display_comments' );
	};

	const foundCarousel = props.isModuleFound( 'carousel' );

	if ( ! foundCarousel ) {
		return null;
	}

	const isCarouselActive = props.getOptionValue( 'carousel' );

	return (
		<SettingsCard
			{ ...props }
			module="media"
			header={ __( 'Media' ) }
			hideButton={ ! foundCarousel }
			saveDisabled={ props.isSavingAnyOption( 'carousel_background_color' ) }
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
					toggling={ props.isSavingAnyOption( 'carousel' ) }
					toggleModule={ props.toggleModuleNow }
				>
					<span className="jp-form-toggle-explanation">
						{ __( 'Display images in a full-screen carousel gallery' ) }
					</span>
				</ModuleToggle>
				<FormFieldset>
					<CompactFormToggle
						checked={ displayExif }
						disabled={
							! isCarouselActive ||
							props.isSavingAnyOption( [ 'carousel', 'carousel_display_exif' ] )
						}
						onChange={ handleCarouselDisplayExifChange /* eslint-disable-line */ }
					>
						<span className="jp-form-toggle-explanation">
							{ __( 'Show photo Exif metadata in carousel (when available)' ) }
						</span>
					</CompactFormToggle>
					<CompactFormToggle
						checked={ displayComments }
						disabled={
							! isCarouselActive ||
							props.isSavingAnyOption( [ 'carousel', 'carousel_display_comments' ] )
						}
						onChange={ handleCarouselDisplayCommentsChange /* eslint-disable-line */ }
					>
						<span className="jp-form-toggle-explanation">
							{ __( 'Show comments area in carousel' ) }
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
							value={ props.getOptionValue( 'carousel_background_color' ) }
							disabled={
								! isCarouselActive ||
								props.isSavingAnyOption( [ 'carousel', 'carousel_background_color' ] )
							}
							{ ...props }
							validValues={ props.validValues( 'carousel_background_color', 'carousel' ) }
						/>
					</FormLabel>
				</FormFieldset>
			</SettingsGroup>
		</SettingsCard>
	);
}

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
		isModuleFound: module_name => _isModuleFound( state, module_name ),
	};
} )( withModuleSettingsFormHelpers( WritingMedia ) );
