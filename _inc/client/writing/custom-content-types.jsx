/**
 * External dependencies
 *
 * @format
 */

import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import CompactFormToggle from 'components/form/form-toggle/compact';

/**
 * Internal dependencies
 */
import CompactCard from 'components/card/compact';
import { FormFieldset } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { getModule, getModuleOverride } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export class CustomContentTypes extends React.Component {
	state = {
		testimonial: this.props.getOptionValue( 'jetpack_testimonial', 'custom-content-types' ),
		portfolio: this.props.getOptionValue( 'jetpack_portfolio', 'custom-content-types' ),
	};

	updateCPTs = type => {
		const deactivate =
			'testimonial' === type
				? ! ( ! this.state.testimonial || this.state.portfolio )
				: ! ( ! this.state.portfolio || this.state.testimonial );

		this.props.updateFormStateModuleOption( 'custom-content-types', 'jetpack_' + type, deactivate );

		this.setState( {
			[ type ]: ! this.state[ type ],
		} );
	};

	linkIfActiveCPT = type => {
		return this.props.getSettingCurrentValue( `jetpack_${ type }`, 'custom-content-types' ) ? (
			<a href={ `${ this.props.siteAdminUrl }edit.php?post_type=jetpack-${ type }` } />
		) : (
			<span />
		);
	};

	handleTestimonialToggleChange = () => {
		this.updateCPTs( 'testimonial' );
	};

	handlePortfolioToggleChange = () => {
		this.updateCPTs( 'portfolio' );
	};

	render() {
		if ( ! this.props.isModuleFound( 'custom-content-types' ) ) {
			return null;
		}

		const module = this.props.module( 'custom-content-types' );
		const disabledByOverride =
			'inactive' === this.props.getModuleOverride( 'custom-content-types' );
		const disabledReason =
			disabledByOverride && __( 'This feature has been disabled by a site administrator.' );
		return (
			<SettingsCard { ...this.props } module="custom-content-types" hideButton>
				<SettingsGroup
					hasChild
					module={ module }
					support={ {
						link: 'https://jetpack.com/support/custom-content-types/',
					} }
				>
					<p>
						{ __(
							'Add {{testimonialLink}}testimonials{{/testimonialLink}} to ' +
								'your website to attract new customers. If your theme doesn’t ' +
								'support Jetpack Testimonials, you can still use a simple ' +
								'shortcode to display them on your site.',
							{
								components: {
									testimonialLink: this.linkIfActiveCPT( 'testimonial' ),
								},
							}
						) }
					</p>
					<CompactFormToggle
						checked={ this.state.testimonial }
						disabled={ this.props.isSavingAnyOption( 'jetpack_testimonial' ) || disabledByOverride }
						onChange={ this.handleTestimonialToggleChange }
						disabledReason={ disabledReason }
					>
						<span className="jp-form-toggle-explanation">{ __( 'Testimonials' ) }</span>
					</CompactFormToggle>
					<FormFieldset>
						<p className="jp-form-setting-explanation">
							{ __( 'Testimonials shortcode: [testimonials]' ) }
						</p>
					</FormFieldset>
				</SettingsGroup>
				{ this.props.testimonialActive && (
					<CompactCard
						className="jp-settings-card__configure-link"
						href={ `${ this.props.siteAdminUrl }post-new.php?post_type=jetpack-testimonial` }
					>
						{ __( 'Add a testimonial' ) }
					</CompactCard>
				) }
				<SettingsGroup
					hasChild
					module={ module }
					support={ {
						link: 'https://jetpack.com/support/custom-content-types/',
					} }
				>
					<p>
						{ __(
							'Use {{portfolioLink}}portfolios{{/portfolioLink}} on your ' +
								'site to showcase your best work. If your theme doesn’t support ' +
								'Jetpack Portfolios, you can still use a simple shortcode to ' +
								'display them on your site.',
							{
								components: {
									portfolioLink: this.linkIfActiveCPT( 'portfolio' ),
								},
							}
						) }
					</p>
					<CompactFormToggle
						checked={ this.state.portfolio }
						disabled={ this.props.isSavingAnyOption( 'jetpack_portfolio' ) || disabledByOverride }
						onChange={ this.handlePortfolioToggleChange }
						disabledReason={ disabledReason }
					>
						<span className="jp-form-toggle-explanation">{ __( 'Portfolios' ) }</span>
					</CompactFormToggle>
					<FormFieldset>
						<p className="jp-form-setting-explanation">
							{ __( 'Portfolios shortcode: [portfolio]' ) }
						</p>
					</FormFieldset>
				</SettingsGroup>
				{ this.props.portfolioActive && (
					<CompactCard
						className="jp-settings-card__configure-link"
						href={ `${ this.props.siteAdminUrl }post-new.php?post_type=jetpack-portfolio` }
					>
						{ __( 'Add a portfolio item' ) }
					</CompactCard>
				) }
			</SettingsCard>
		);
	}
}

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		const portfolioActive = ownProps.getSettingCurrentValue(
			'jetpack_portfolio',
			'custom-content-types'
		);
		const testimonialActive = ownProps.getSettingCurrentValue(
			'jetpack_testimonial',
			'custom-content-types'
		);
		return {
			module: module_name => getModule( state, module_name ),
			isModuleFound: module_name => _isModuleFound( state, module_name ),
			getModuleOverride: module_name => getModuleOverride( state, module_name ),
			portfolioActive,
			testimonialActive,
		};
	} )( CustomContentTypes )
);
