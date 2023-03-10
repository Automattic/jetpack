import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { FormLabel, FormLegend } from 'components/forms';
import ModuleOverriddenBanner from 'components/module-overridden-banner';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import React from 'react';
import { connect } from 'react-redux';
import { currentThemeSupports } from 'state/initial-state';
import { getModule } from 'state/modules';
import { isModuleFound } from 'state/search';

class ThemeEnhancements extends React.Component {
	/**
	 * Translate Infinite Scroll module and option status into our three values for the options.
	 *
	 * @returns {string} Check the Infinite Scroll and its mode and translate into a string.
	 */
	getInfiniteMode = () => {
		if ( ! this.props.getOptionValue( 'infinite-scroll' ) ) {
			return 'infinite_default';
		}
		if ( this.props.getOptionValue( 'infinite_scroll', 'infinite-scroll' ) ) {
			return 'infinite_scroll';
		}
		return 'infinite_button';
	};

	/**
	 * Update the state for infinite scroll options and prepare options to submit
	 *
	 * @param {string} radio Update options to save when Infinite Scroll options change.
	 */
	updateInfiniteMode = radio => {
		this.setState(
			{
				infinite_mode: radio,
			},
			this.prepareOptionsToUpdate
		);
	};

	/**
	 * Update the options that will be submitted to translate from the three radios to the module and option status.
	 */
	prepareOptionsToUpdate = () => {
		if ( 'infinite_default' === this.state.infinite_mode ) {
			this.props.updateFormStateOptionValue( 'infinite-scroll', false );
		} else if (
			'infinite_scroll' === this.state.infinite_mode ||
			'infinite_button' === this.state.infinite_mode
		) {
			this.props.updateFormStateOptionValue( {
				'infinite-scroll': true,
				infinite_scroll: 'infinite_scroll' === this.state.infinite_mode,
			} );
		}
	};

	/**
	 * Update state so toggles are updated.
	 *
	 * @param {string} optionName option slug
	 * @param {string} module module slug
	 */
	updateOptions = ( optionName, module ) => {
		this.setState(
			{
				[ optionName ]: ! this.state[ optionName ],
			},
			this.props.updateFormStateModuleOption( module, optionName )
		);
	};

	trackLearnMoreIS = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'learn-more',
			feature: 'infinite-scroll',
			extra: 'not-supported-link',
		} );
	};

	trackVisitCustomizer = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'visit-customizer',
			feature: 'custom-css',
			extra: 'not-supported-link',
		} );
	};

	/**
	 * Get options for initial state.
	 *
	 * @returns {Object} {{
	 * 		infinite_scroll: *
	 * }}
	 */
	state = {
		infinite_mode: this.getInfiniteMode(),
	};

	handleInfiniteScrollModeChange = key => {
		return () => this.updateInfiniteMode( key );
	};

	render() {
		const foundInfiniteScroll = this.props.isModuleFound( 'infinite-scroll' ),
			foundCustomCSS = this.props.isModuleFound( 'custom-css' );

		if ( ! foundInfiniteScroll && ! foundCustomCSS ) {
			return null;
		}

		const infScr = this.props.getModule( 'infinite-scroll' );
		const customCSS = this.props.getModule( 'custom-css' );

		const infiniteScrollDisabledByOverride =
			'inactive' === this.props.getModuleOverride( 'infinite-scroll' );

		return (
			<SettingsCard
				{ ...this.props }
				header={ __( 'Theme enhancements', 'jetpack' ) }
				hideButton={ ! foundInfiniteScroll || ! this.props.isInfiniteScrollSupported }
				module="theme-enhancements"
			>
				{ infiniteScrollDisabledByOverride && (
					<ModuleOverriddenBanner moduleName={ infScr.name } compact />
				) }
				{ foundInfiniteScroll && ! infiniteScrollDisabledByOverride && (
					<SettingsGroup
						hasChild
						module={ { module: infScr.module } }
						key={ `theme_enhancement_${ infScr.module }` }
						support={ {
							text: __(
								'Loads the next posts automatically when the reader approaches the bottom of the page.',
								'jetpack'
							),
							link: getRedirectUrl( 'jetpack-support-infinite-scroll' ),
						} }
					>
						<FormLegend className="jp-form-label-wide">{ infScr.name }</FormLegend>
						<p>
							{ __(
								'Create a smooth, uninterrupted reading experience by loading more content as visitors scroll to the bottom of your archive pages.',
								'jetpack'
							) }
						</p>
						{ this.props.isInfiniteScrollSupported ? (
							[
								{
									key: 'infinite_default',
									label: __( 'Load more posts using the default theme behavior', 'jetpack' ),
								},
								{
									key: 'infinite_button',
									label: __( 'Load more posts in page with a button', 'jetpack' ),
								},
								{
									key: 'infinite_scroll',
									label: __( 'Load more posts as the reader scrolls down', 'jetpack' ),
								},
							].map( radio => (
								<FormLabel key={ `${ infScr.module }_${ radio.key }` }>
									<input
										type="radio"
										name="infinite_mode"
										value={ radio.key }
										checked={ radio.key === this.state.infinite_mode }
										disabled={ this.props.isSavingAnyOption( [ infScr.module, radio.key ] ) }
										onChange={ this.handleInfiniteScrollModeChange( radio.key ) }
									/>
									<span className="jp-form-toggle-explanation">{ radio.label }</span>
								</FormLabel>
							) )
						) : (
							<span>
								{ __( 'Theme support required.', 'jetpack' ) + ' ' }
								<a
									onClick={ this.trackLearnMoreIS }
									href={ infScr.learn_more_button + '#theme' }
									title={ __(
										'Learn more about adding support for Infinite Scroll to your theme.',
										'jetpack'
									) }
								>
									{ __( 'Learn more', 'jetpack' ) }
								</a>
							</span>
						) }
					</SettingsGroup>
				) }
				{ foundCustomCSS && (
					<SettingsGroup
						module={ { module: customCSS.module } }
						support={ {
							text: customCSS.description,
							link: getRedirectUrl( 'jetpack-support-custom-css' ),
						} }
					>
						<FormLegend className="jp-form-label-wide">{ customCSS.name }</FormLegend>
						<span>
							<p>
								{ __(
									'Additional CSS can be added from the Customizer. Enable the enhanced Custom CSS feature below to add additional features.',
									'jetpack'
								) + ' ' }
								<a
									onClick={ this.trackVisitCustomizer }
									href={ `${ this.props.siteAdminUrl }customize.php?autofocus%5Bsection%5D=custom_css` }
									title={ __(
										'Edit and add CSS directly on your site from the Customizer.',
										'jetpack'
									) }
								>
									{ __( 'Access the Customizer here.', 'jetpack' ) }
								</a>
							</p>
						</span>
						<ModuleToggle
							slug="custom-css"
							activated={ !! this.props.getOptionValue( 'custom-css' ) }
							toggling={ this.props.isSavingAnyOption( [ 'custom-css' ] ) }
							disabled={ this.props.isSavingAnyOption( [ 'custom-css' ] ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">
								{ __( 'Enhance CSS customization panel', 'jetpack' ) }
							</span>
						</ModuleToggle>
					</SettingsGroup>
				) }
			</SettingsCard>
		);
	}
}

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
		isInfiniteScrollSupported: currentThemeSupports( state, 'infinite-scroll' ),
		isModuleFound: module_name => isModuleFound( state, module_name ),
	};
} )( withModuleSettingsFormHelpers( ThemeEnhancements ) );
