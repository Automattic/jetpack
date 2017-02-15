/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';
import CompactFormToggle from 'components/form/form-toggle/compact';

/**
 * Internal dependencies
 */
import { FormFieldset } from 'components/forms';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { getModule } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

const CustomContentTypes = moduleSettingsForm(
	React.createClass( {

		contentTypeConfigure( type, legend ) {
			let disabledOrHref = this.props.getSettingCurrentValue( 'jetpack_' + type, 'custom-content-types' )
				? { href: this.props.siteAdminUrl + 'edit.php?post_type=jetpack-' + type }
				: { disabled: true };
			return (
				<Button compact	{ ...disabledOrHref }>
					{ legend }
				</Button>
			);
		},

		getInitialState() {
			return {
				testimonial: this.props.getOptionValue( 'jetpack_testimonial', 'custom-content-types' ),
				portfolio: this.props.getOptionValue( 'jetpack_portfolio', 'custom-content-types' )
			};
		},

		updateCPTs( type ) {
			let deactivate = 'testimonial' === type
				? ! ( ( ! this.state.testimonial ) || this.state.portfolio )
				: ! ( ( ! this.state.portfolio ) || this.state.testimonial );

			this.props.updateFormStateModuleOption( 'custom-content-types', 'jetpack_' + type, deactivate );

			this.setState( {
				[ type ]: ! this.state[ type ]
			} );
		},

		render() {
			if ( ! this.props.isModuleFound( 'custom-content-types' ) ) {
				return null;
			}

			let module = this.props.module( 'custom-content-types' );
			return (
				<SettingsCard
					{ ...this.props }
					module="custom-content-types"
					hideButton>
					<SettingsGroup hasChild support={ module.learn_more_button }>
						<CompactFormToggle
									checked={ this.state.testimonial }
									disabled={ this.props.isSavingAnyOption() }
									onChange={ () => this.updateCPTs( 'testimonial' ) }>
							<span className="jp-form-toggle-explanation">
								{
									__( 'Enable Testimonial custom content type' )
								}
							</span>
						</CompactFormToggle>
						<FormFieldset>
							<p className="jp-form-setting-explanation">
								{
									__( 'The Testimonial custom content type allows you to add, organize, and display your testimonials. If your theme doesn’t support it yet, you can display testimonials using the testimonial shortcode	( [testimonials] ) or you can view a full archive of your testimonials.' )
								}
							</p>
							<p>
								{
									this.contentTypeConfigure( 'testimonial', __( 'Configure Testimonials' ) )
								}
							</p>
						</FormFieldset>
						<CompactFormToggle
									checked={ this.state.portfolio }
									disabled={ this.props.isSavingAnyOption() }
									onChange={ () => this.updateCPTs( 'portfolio' ) }>
							<span className="jp-form-toggle-explanation">
								{
									__( 'Enable Portfolio custom content type' )
								}
							</span>
						</CompactFormToggle>
						<FormFieldset>
							<p className="jp-form-setting-explanation">
								{
									__( 'The Portfolio custom content type allows you to add, organize, and display your portfolios. If your theme doesn’t support it yet, you can display portfolios using the portfolio shortcode ( [portfolios] ) or you can view a full archive of your portfolios.' )
								}
							</p>
							<p>
								{
									this.contentTypeConfigure( 'portfolio', __( 'Configure Portfolios' ) )
								}
							</p>
						</FormFieldset>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);

export default connect(
	( state ) => {
		return {
			module: ( module_name ) => getModule( state, module_name ),
			isModuleFound: ( module_name ) => _isModuleFound( state, module_name )
		}
	}
)( CustomContentTypes );
