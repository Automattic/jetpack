import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import CompactFormToggle from 'components/form/form-toggle/compact';
import { FormFieldset, FormLegend, FormLabel, FormSelect } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import React from 'react';
import { connect } from 'react-redux';
import { getModule } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';

/**
 * Renders controls to activate the carousel and additional settings.
 *
 * @param {object} props - Component properties.
 * @returns {object} - Controls for carousel.
 */
function WritingMedia( props ) {
	const foundCarousel = props.isModuleFound( 'carousel' );

	if ( ! foundCarousel ) {
		return null;
	}

	const displayComments = props.getOptionValue( 'carousel_display_comments', 'carousel' );
	const displayExif = props.getOptionValue( 'carousel_display_exif', 'carousel' );
	const isCarouselActive = props.getOptionValue( 'carousel' );

	const handleCarouselDisplayExifChange = () => {
		props.updateFormStateModuleOption( 'carousel', 'carousel_display_exif' );
	};

	const handleCarouselDisplayCommentsChange = () => {
		props.updateFormStateModuleOption( 'carousel', 'carousel_display_comments' );
	};

	/**
	 * Render a toggle. For example the toggle for EXIF data.
	 *
	 * @param {string} checked - Current state of the toggle.
	 * @param {string} optionName - Name of the option that the toggle state will be saved to.
	 * @param {Function} onChangeHandler - Method to call when the toggle is clicked.
	 * @param {string} label - Description for the toggle.
	 * @returns {object} A compact toggle component.
	 */
	const renderToggle = ( checked, optionName, onChangeHandler, label ) => (
		<CompactFormToggle
			checked={ checked }
			disabled={ ! isCarouselActive || props.isSavingAnyOption( [ 'carousel', optionName ] ) }
			onChange={ onChangeHandler /* eslint-disable-line */ }
		>
			<span className="jp-form-toggle-explanation">{ label }</span>
		</CompactFormToggle>
	);

	return (
		<SettingsCard
			{ ...props }
			module="media"
			header={ __( 'Media', 'jetpack' ) }
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
						'Create full-screen carousel slideshows for the images in your posts and pages. Carousel galleries are mobile-friendly and encourage site visitors to interact with your photos.',
						'jetpack'
					) }
				</p>
				<ModuleToggle
					slug="carousel"
					activated={ isCarouselActive }
					toggling={ props.isSavingAnyOption( 'carousel' ) }
					toggleModule={ props.toggleModuleNow }
				>
					<span className="jp-form-toggle-explanation">
						{ __( 'Display images in a full-screen carousel gallery', 'jetpack' ) }
					</span>
				</ModuleToggle>
				<FormFieldset>
					{ renderToggle(
						displayExif,
						'carousel_display_exif',
						handleCarouselDisplayExifChange,
						__( 'Show photo Exif metadata in carousel (when available)', 'jetpack' )
					) }
					{ renderToggle(
						displayComments,
						'carousel_display_comments',
						handleCarouselDisplayCommentsChange,
						__( 'Show comments area in carousel', 'jetpack' )
					) }
					<FormFieldset>
						<p className="jp-form-setting-explanation">
							{ __(
								'Exif data shows viewers additional technical details of a photo, like its focal length, aperture, and ISO.',
								'jetpack'
							) }
						</p>
					</FormFieldset>
					<FormLabel>
						<FormLegend className="jp-form-label-wide">
							{ __( 'Carousel color scheme', 'jetpack' ) }
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
