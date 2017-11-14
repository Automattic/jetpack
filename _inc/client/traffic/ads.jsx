/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import CompactFormToggle from 'components/form/form-toggle/compact';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { FEATURE_WORDADS_JETPACK } from 'lib/plans/constants';
import { FormFieldset, FormLegend } from 'components/forms';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export const Ads = moduleSettingsForm( class extends React.Component {
    /**
	 * Get options for initial state.
	 *
	 * @returns {{enable_header_ad: Boolean}}
	 */
	state = {
		enable_header_ad: this.props.getOptionValue( 'enable_header_ad', 'wordads' ),
		wordads_second_belowpost: this.props.getOptionValue( 'wordads_second_belowpost', 'wordads' ),
		wordads_display_front_page: this.props.getOptionValue( 'wordads_display_front_page', 'wordads' ),
		wordads_display_post: this.props.getOptionValue( 'wordads_display_post', 'wordads' ),
		wordads_display_page: this.props.getOptionValue( 'wordads_display_page', 'wordads' ),
		wordads_display_archive: this.props.getOptionValue( 'wordads_display_archive', 'wordads' ),
	};

	/**
	 * Update state so preview is updated instantly and toggle options.
	 *
	 * @param {string} optionName
	 */
	updateOptions = optionName => {
		this.setState(
			{
				[ optionName ]: ! this.state[ optionName ]
			},
			this.props.updateFormStateModuleOption( 'wordads', optionName )
		);
	};

	trackConfigureClick = () => {
		analytics.tracks.recordJetpackClick( 'view-earnings' );
	};

	render() {
		const isAdsActive = this.props.getOptionValue( 'wordads' );
		const unavailableInDevMode = this.props.isUnavailableInDevMode( 'wordads' );
		return (
			<SettingsCard
				{ ...this.props }
				header={ __( 'Ads', { context: 'Ads header' } ) }
				feature={ FEATURE_WORDADS_JETPACK }
				hideButton>
				<SettingsGroup
					disableInDevMode
					hasChild
					module={ { module: 'wordads' } }
					support="https://jetpack.com/support/ads/">
					<p>
						{ __( 'Show ads on the first article on your home page or at the end of every page and post. Place additional ads at the top of your site and to any widget area to increase your earnings.' ) }
						<br />
						<small className="jp-form-setting-explanation">
							{ __( 'By activating ads, you agree to the Automattic Ads {{link}}Terms of Service{{/link}}.', {
								components: {
									link: <a href="https://wordpress.com/automattic-ads-tos/" target="_blank" rel="noopener noreferrer" />
								}
							} ) }
						</small>
					</p>

					<ModuleToggle
						slug="wordads"
						disabled={ unavailableInDevMode }
						activated={ isAdsActive }
						toggling={ this.props.isSavingAnyOption( 'wordads' ) }
						toggleModule={ this.props.toggleModuleNow }>
						<span className="jp-form-toggle-explanation">
							{ __( 'Enable ads and display an ad below each post' ) }
						</span>
					</ModuleToggle>
					<FormFieldset>
						<FormLegend>{ __( 'Display ads below posts on' ) }</FormLegend>
						<CompactFormToggle
							checked={ this.state.wordads_display_front_page }
							disabled={ ! isAdsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'wordads', 'wordads_display_front_page' ] ) }
							onChange={ () => this.updateOptions( 'wordads_display_front_page' ) }>
							<span className="jp-form-toggle-explanation">
								{ __( 'Front page' ) }
							</span>
						</CompactFormToggle>
						<CompactFormToggle
							checked={ this.state.wordads_display_post }
							disabled={ ! isAdsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'wordads', 'wordads_display_post' ] ) }
							onChange={ () => this.updateOptions( 'wordads_display_post' ) }>
							<span className="jp-form-toggle-explanation">
								{ __( 'Posts' ) }
							</span>
						</CompactFormToggle>
						<CompactFormToggle
							checked={ this.state.wordads_display_page }
							disabled={ ! isAdsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'wordads', 'wordads_display_page' ] ) }
							onChange={ () => this.updateOptions( 'wordads_display_page' ) }>
							<span className="jp-form-toggle-explanation">
								{ __( 'Pages' ) }
							</span>
						</CompactFormToggle>
						<CompactFormToggle
							checked={ this.state.wordads_display_archive }
							disabled={ ! isAdsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'wordads', 'wordads_display_archive' ] ) }
							onChange={ () => this.updateOptions( 'wordads_display_archive' ) }>
							<span className="jp-form-toggle-explanation">
								{ __( 'Archives' ) }
							</span>
						</CompactFormToggle>
					</FormFieldset>
					<FormFieldset>
						<FormLegend>{ __( 'Additional ad placements' ) }</FormLegend>
						<CompactFormToggle
							checked={ this.state.enable_header_ad }
							disabled={ ! isAdsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'wordads', 'enable_header_ad' ] ) }
							onChange={ () => this.updateOptions( 'enable_header_ad' ) }>
							<span className="jp-form-toggle-explanation">
								{ __( 'Top of each page' ) }
							</span>
						</CompactFormToggle>
						<CompactFormToggle
							checked={ this.state.wordads_second_belowpost }
							disabled={ ! isAdsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'wordads', 'wordads_second_belowpost' ] ) }
							onChange={ () => this.updateOptions( 'wordads_second_belowpost' ) }>
							<span className="jp-form-toggle-explanation">
								{ __( 'Second ad below post' ) }
							</span>
						</CompactFormToggle>
					</FormFieldset>
				</SettingsGroup>
				{
					! unavailableInDevMode && isAdsActive && (
						<Card compact className="jp-settings-card__configure-link" onClick={ this.trackConfigureClick } href={ this.props.configureUrl }>{ __( 'View your earnings' ) }</Card>
					)
				}
			</SettingsCard>
		);
	}
} );
