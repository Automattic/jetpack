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
import { getModuleOverride } from 'state/modules';

class Media extends React.Component {
	/**
 	* Get options for initial state.
 	*
 	* @returns {Object} {{carousel_display_exif: Boolean}}
 	*/
	state = {
		carousel_display_exif: this.props.getOptionValue( 'carousel_display_exif', 'carousel' )
	};

	/**
 	* Update state so toggles are updated.
 	*
 	* @param {string} optionName option slug
 	*/
	updateOptions = ( optionName ) => {
		this.setState(
			{
				[ optionName ]: ! this.state[ optionName ]
			},
			this.props.updateFormStateModuleOption( 'carousel', optionName )
		);
	};

	handleCarouselDisplayExifChange = () => {
		this.updateOptions( 'carousel_display_exif' );
	};

	render() {
		const foundCarousel = this.props.isModuleFound( 'carousel' ),
			foundVideoPress = this.props.isModuleFound( 'videopress' );

		if ( ! foundCarousel && ! foundVideoPress ) {
			return null;
		}

		const isCarouselActive = this.props.getOptionValue( 'carousel' ),
			videoPress = this.props.module( 'videopress' ),
			planClass = getPlanClass( this.props.sitePlan.product_slug );

		const carouselSettings = (
			<SettingsGroup
				hasChild
				module={ { module: 'carousel' } }
				support={ {
					link: 'https://jetpack.com/support/carousel',
				} }
				>
				<FormLegend className="jp-form-label-wide">
					{ __( 'Images' ) }
				</FormLegend>
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
						{
							__( 'Display images in a full-screen carousel gallery' )
						}
					</span>
				</ModuleToggle>
				<FormFieldset>
					<CompactFormToggle
						checked={ this.state.carousel_display_exif }
						disabled={ ! isCarouselActive || this.props.isSavingAnyOption( [ 'carousel', 'carousel_display_exif' ] ) }
						onChange={ this.handleCarouselDisplayExifChange }
						>
						<span className="jp-form-toggle-explanation">
							{
								__( 'Show photo Exif metadata in carousel (when available)' )
							}
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
				module={ videoPress }
				support={ {
					link: 'https://jetpack.com/support/videopress/',
				} }
				>
				<FormLegend className="jp-form-label-wide">
					{ __( 'Video' ) }
				</FormLegend>
				<p> { __(
					'Make the content you publish more engaging with high-resolution video. ' +
						'With Jetpack Video you can customize your media player and deliver ' +
						'high-speed, ad-free, and unbranded videos to your visitors. Videos are hosted on our WordPress.com servers and do not subtract space from your hosting plan!'
				) } </p>
				<ModuleToggle
					slug="videopress"
					disabled={ this.props.isUnavailableInDevMode( 'videopress' ) }
					activated={ this.props.getOptionValue( 'videopress' ) }
					toggling={ this.props.isSavingAnyOption( 'videopress' ) }
					toggleModule={ this.props.toggleModuleNow }
					>
					<span className="jp-form-toggle-explanation">
						{
							__( 'Enable high-speed, ad-free video player' )
						}
					</span>
				</ModuleToggle>
			</SettingsGroup>
		);

		const videoPressForcedInactive = 'inactive' === this.props.getModuleOverride( 'videopress' );

		return (
			<SettingsCard
				{ ...this.props }
				header={ __( 'Media' ) }
				hideButton={ ! foundCarousel }
				feature={ ! videoPressForcedInactive && FEATURE_VIDEO_HOSTING_JETPACK }
				saveDisabled={ this.props.isSavingAnyOption( 'carousel_background_color' ) }
				>
				{ foundCarousel && carouselSettings }
				{ foundVideoPress && videoPressSettings }
			</SettingsCard>
		);
	}
}

export default connect(
	( state ) => {
		return {
			module: ( module_name ) => getModule( state, module_name ),
			isModuleFound: ( module_name ) => _isModuleFound( state, module_name ),
			sitePlan: getSitePlan( state ),
			getModuleOverride: module_name => getModuleOverride( state, module_name ),
		};
	}
)( moduleSettingsForm( Media ) );
