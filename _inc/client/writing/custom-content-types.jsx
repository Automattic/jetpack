/**
 * External dependencies
 */
import React from 'react';
import analytics from 'lib/analytics';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';

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
import SettingsCard from 'components/settings-card';

export const CustomContentTypes = moduleSettingsForm(
	React.createClass( {

		toggleModule( name, value ) {
			this.props.updateFormStateOptionValue( name, !value );
		},

		contentTypeConfigure( module, type, legend ) {
			return ! this.props.getOptionCurrentValue( module, 'jetpack_' + type )
				? ''
				: <Button
					disabled={ ! this.props.shouldSaveButtonBeDisabled() }
					href={ this.props.siteAdminUrl + 'edit.php?post_type=jetpack-' + type }
					compact={ true }>
					{
						legend
					}
				  </Button>;
		},

		render() {
			let module = this.props.getModule( 'custom-content-types' );
			return (
				<SettingsCard module="custom-content-types" { ...this.props }>
					<FormFieldset>
						<p>
							{
								module.description
							}
						</p>
						<ModuleToggle slug={ 'custom-content-types' }
									  compact
									  activated={ this.props.getOptionValue( 'jetpack_testimonial' ) }
									  toggling={ this.props.isSavingAnyOption() }
									  toggleModule={ m => this.props.updateFormStateModuleOption( m, 'jetpack_testimonial' ) }>
							<span className="jp-form-toggle-explanation">
								{
									__( 'Enable Testimonial custom content types.' )
								}
							</span>
						</ModuleToggle>
						<p>
							{
								__( "The Testimonial custom content type allows you to add, organize, and display your testimonials. If your theme doesn’t support it yet, you can display testimonials using the testimonial shortcode	( [testimonials] ) or you can view a full archive of your testimonials." )
							}
						</p>
						{
							this.contentTypeConfigure( module.module, 'testimonial', __( 'Configure Testimonials' ) )
						}
						<br />
						<ModuleToggle slug={ 'custom-content-types' }
									  compact
									  activated={ this.props.getOptionValue( 'jetpack_portfolio' ) }
									  toggling={ this.props.isSavingAnyOption() }
									  toggleModule={ m => this.props.updateFormStateModuleOption( m, 'jetpack_portfolio' ) }>
							<span className="jp-form-toggle-explanation">
								{
									__( 'Enable Portfolio custom content types.' )
								}
							</span>
						</ModuleToggle>
						<p>
							{
								__( "The Portfolio custom content type allows you to add, organize, and display your portfolios. If your theme doesn’t support it yet, you can display portfolios using the portfolio shortcode ( [portfolios] ) or you can view a full archive of your portfolios." )
							}
						</p>
						{
							this.contentTypeConfigure( module.module, 'portfolio', __( 'Configure Portfolios' ) )
						}
					</FormFieldset>
				</SettingsCard>
			);
		}
	} )
);
