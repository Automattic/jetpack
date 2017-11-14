/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
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

export class CustomContentTypes extends React.Component {
	state = {
		testimonial: this.props.getOptionValue( 'jetpack_testimonial', 'custom-content-types' ),
		portfolio: this.props.getOptionValue( 'jetpack_portfolio', 'custom-content-types' )
	};

	updateCPTs = type => {
		const deactivate = 'testimonial' === type
			? ! ( ( ! this.state.testimonial ) || this.state.portfolio )
			: ! ( ( ! this.state.portfolio ) || this.state.testimonial );

		this.props.updateFormStateModuleOption( 'custom-content-types', 'jetpack_' + type, deactivate );

		this.setState( {
			[ type ]: ! this.state[ type ]
		} );
	};

	linkIfActiveCPT = type => {
		return this.props.getSettingCurrentValue( 'jetpack_' + type, 'custom-content-types' )
			? <a href={ this.props.siteAdminUrl + 'edit.php?post_type=jetpack-' + type } />
			: <span />;
	};

	render() {
		if ( ! this.props.isModuleFound( 'custom-content-types' ) ) {
			return null;
		}

		const module = this.props.module( 'custom-content-types' );
		return (
			<SettingsCard
				{ ...this.props }
				module="custom-content-types"
				hideButton>
				<SettingsGroup hasChild module={ module } support={ module.learn_more_button }>
					<CompactFormToggle
								checked={ this.state.testimonial }
								disabled={ this.props.isSavingAnyOption( 'jetpack_testimonial' ) }
								onChange={ () => this.updateCPTs( 'testimonial' ) }>
						<span className="jp-form-toggle-explanation">
							{
								__( 'Testimonials' )
							}
						</span>
					</CompactFormToggle>
					<FormFieldset>
						<p className="jp-form-setting-explanation">
							{
								__( 'Add, organize, and display {{testimonialLink}}testimonials{{/testimonialLink}}. If your theme doesn’t support testimonials yet, you can display them using the shortcode	( [testimonials] ).',
									{
										components: {
											testimonialLink: this.linkIfActiveCPT( 'testimonial' )
										}
									}
								)
							}
						</p>
					</FormFieldset>
					<CompactFormToggle
								checked={ this.state.portfolio }
								disabled={ this.props.isSavingAnyOption( 'jetpack_portfolio' ) }
								onChange={ () => this.updateCPTs( 'portfolio' ) }>
						<span className="jp-form-toggle-explanation">
							{
								__( 'Portfolios' )
							}
						</span>
					</CompactFormToggle>
					<FormFieldset>
						<p className="jp-form-setting-explanation">
							{
								__( 'Add, organize, and display {{portfolioLink}}portfolios{{/portfolioLink}}. If your theme doesn’t support portfolios yet, you can display them using the shortcode ( [portfolio] ).',
									{
										components: {
											portfolioLink: this.linkIfActiveCPT( 'portfolio' )
										}
									}
								)
							}
						</p>
					</FormFieldset>
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

export default connect(
	( state ) => {
		return {
			module: ( module_name ) => getModule( state, module_name ),
			isModuleFound: ( module_name ) => _isModuleFound( state, module_name )
		};
	}
)( moduleSettingsForm( CustomContentTypes ) );
