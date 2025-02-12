import { ToggleControl, getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { connect } from 'react-redux';
import CompactCard from 'components/card/compact';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { getModule } from 'state/modules';
import { updateSettings } from 'state/settings';

export class CustomContentTypes extends React.Component {
	state = {
		testimonial: this.props.getOptionValue( 'jetpack_testimonial' ) || false,
		portfolio: this.props.getOptionValue( 'jetpack_portfolio' ) || false,
	};

	updateCPTs = type => {
		const deactivate = 'testimonial' === type ? ! this.state.testimonial : ! this.state.portfolio;

		if ( type === 'portfolio' ) {
			this.props.updateSettings( { jetpack_portfolio: deactivate } );
		} else {
			this.props.updateSettings( { jetpack_testimonial: deactivate } );
		}

		this.setState( {
			[ type ]: ! this.state[ type ],
		} );
	};

	linkIfActiveCPT = type => {
		return this.props.getSettingCurrentValue( `jetpack_${ type }` ) ? (
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
		if ( ! this.props.customContentTypeIsActive ) {
			return null;
		}

		const disabledByOverride = this.props.customContentTypeIsOverridden;
		const disabledReason =
			disabledByOverride &&
			__( 'This feature has been disabled by a site administrator.', 'jetpack' );

		const woa_theme_supports_jetpack_portfolio =
			typeof jetpack_portfolio_theme_supports !== 'undefined'
				? jetpack_portfolio_theme_supports // eslint-disable-line no-undef
				: false;
		const portfolioDisabledReason =
			! disabledReason && woa_theme_supports_jetpack_portfolio
				? __( 'This feature is already supported by your theme.', 'jetpack' )
				: '';
		const portfolioText = woa_theme_supports_jetpack_portfolio
			? createInterpolateElement(
					__(
						'Use <portfolioLink>portfolios</portfolioLink> on your site to showcase your best work. If your theme doesn’t support Jetpack Portfolios, you can still use a simple shortcode to display them on your site. This feature is enabled by default in your theme settings.',
						'jetpack'
					),
					{
						portfolioLink: this.linkIfActiveCPT( 'portfolio' ),
					}
			  )
			: createInterpolateElement(
					__(
						'Use <portfolioLink>portfolios</portfolioLink> on your site to showcase your best work. If your theme doesn’t support Jetpack Portfolios, you can still use a simple shortcode to display them on your site.',
						'jetpack'
					),
					{
						portfolioLink: this.linkIfActiveCPT( 'portfolio' ),
					}
			  );

		const woa_theme_supports_jetpack_testimonial =
			typeof jetpack_testimonial_theme_supports !== 'undefined'
				? jetpack_testimonial_theme_supports // eslint-disable-line no-undef
				: false;
		const testimonialDisabledReason =
			! disabledReason && woa_theme_supports_jetpack_testimonial
				? __( 'This feature is already supported by your theme.', 'jetpack' )
				: '';
		const testimonialText = woa_theme_supports_jetpack_testimonial
			? createInterpolateElement(
					__(
						'Use <testimonialLink>testimonials</testimonialLink> on your site to showcase your best work. If your theme doesn’t support Jetpack Testimonials, you can still use a simple shortcode to display them on your site. This feature is enabled by default in your theme settings.',
						'jetpack'
					),
					{
						testimonialLink: this.linkIfActiveCPT( 'testimonial' ),
					}
			  )
			: createInterpolateElement(
					__(
						'Use <testimonialLink>testimonials</testimonialLink> on your site to showcase your best work. If your theme doesn’t support Jetpack Testimonials, you can still use a simple shortcode to display them on your site.',
						'jetpack'
					),
					{
						testimonialLink: this.linkIfActiveCPT( 'testimonial' ),
					}
			  );

		return (
			<SettingsCard
				{ ...this.props }
				module="custom-content-types"
				header="Custom content types"
				hideButton
			>
				<SettingsGroup
					hasChild
					module={ { module: 'custom-content-types' } }
					support={ {
						link: getRedirectUrl( 'jetpack-support-custom-content-types' ),
					} }
				>
					<p> { testimonialText } </p>
					<ToggleControl
						checked={
							this.props.getOptionValue( 'jetpack_testimonial' )
								? this.props.getOptionValue( 'jetpack_testimonial' )
								: false
						}
						disabled={ disabledByOverride || woa_theme_supports_jetpack_testimonial }
						toggling={ this.props.isSavingAnyOption( 'jetpack_testimonial' ) }
						onChange={ this.handleTestimonialToggleChange }
						disabledReason={ testimonialDisabledReason }
						label={
							<span className="jp-form-toggle-explanation">
								{ __( 'Testimonials', 'jetpack' ) }
							</span>
						}
						help={
							<span className="jp-form-setting-explanation jp-form-shortcode-setting-explanation">
								{ __( 'Testimonials shortcode: [testimonials]', 'jetpack' ) }
							</span>
						}
					/>
				</SettingsGroup>
				{ this.props.getOptionValue( 'jetpack_testimonial' ) && (
					<CompactCard
						className="jp-settings-card__configure-link"
						href={ `${ this.props.siteAdminUrl }post-new.php?post_type=jetpack-testimonial` }
					>
						{ __( 'Add a testimonial', 'jetpack' ) }
					</CompactCard>
				) }
				<SettingsGroup
					hasChild
					module={ { module: 'custom-content-types' } }
					support={ {
						link: getRedirectUrl( 'jetpack-support-custom-content-types' ),
					} }
				>
					<p>{ portfolioText }</p>
					<ToggleControl
						checked={
							this.props.getOptionValue( 'jetpack_portfolio' )
								? this.props.getOptionValue( 'jetpack_portfolio' )
								: false
						}
						disabled={ disabledByOverride || woa_theme_supports_jetpack_portfolio }
						toggling={ this.props.isSavingAnyOption( 'jetpack_portfolio' ) }
						onChange={ this.handlePortfolioToggleChange }
						disabledReason={ portfolioDisabledReason }
						label={
							<span className="jp-form-toggle-explanation">{ __( 'Portfolios', 'jetpack' ) }</span>
						}
						help={
							<span className="jp-form-setting-explanation jp-form-shortcode-setting-explanation">
								{ __( 'Portfolios shortcode: [portfolio]', 'jetpack' ) }
							</span>
						}
					/>
				</SettingsGroup>
				{ this.props.getOptionValue( 'jetpack_portfolio' ) && (
					<CompactCard
						className="jp-settings-card__configure-link"
						href={ `${ this.props.siteAdminUrl }post-new.php?post_type=jetpack-portfolio` }
					>
						{ __( 'Add a portfolio item', 'jetpack' ) }
					</CompactCard>
				) }
			</SettingsCard>
		);
	}
}

export default withModuleSettingsFormHelpers(
	connect(
		state => {
			return {
				module: module_name => getModule( state, module_name ),
			};
		},
		dispatch => ( {
			updateSettings: module_option => {
				return dispatch( updateSettings( module_option ) );
			},
		} )
	)( CustomContentTypes )
);
