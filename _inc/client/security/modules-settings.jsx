/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { FormFieldset, FormLegend, FormTextarea, FormLabel} from 'components/forms';
import { ModuleOptionBoolean } from 'components/module-options';

export const SecurityModulesSettings = React.createClass( {
	render() {
		let { module } = this.props;
		switch ( module.module ) {
			case 'protect':
				return( <ProtectSettings module={ module } { ...this.props } /> );
			case 'monitor':
				return ( <MonitorSettings module={ module } { ...this.props } /> );
			case 'scan':
				return ( <div>You can see the information about security scanning in the "At a Glance" section.</div> );
			case 'sso':
				return ( <SingleSignOnSettings module={ module } { ...this.props } /> );
			default:
				return (
					<div>
						<a href={ module.configure_url }>{ __( 'Link to old settings' ) }</a>
					</div>
				);
		}
	}
} );

export const ProtectSettings = React.createClass( {
	render() {
		return (
			<FormFieldset>
				<FormLegend>{ __( 'Whitelist Management' ) }</FormLegend>
				<FormLabel>
					<span>{ __( 'IP addresses/ranges list' ) }</span>
					<FormTextarea></FormTextarea>
				</FormLabel>
			</FormFieldset>
		)
	}
} );

export const MonitorSettings = React.createClass( {
	render() {
		return (
			<FormFieldset>
				<ModuleOptionBoolean option_name={ 'monitor_receive_notifications' } { ...this.props } label={ __( 'Receive Monitor Email Notifications' ) } />
				<ModuleOptionBoolean option_name={ 'option_name' } { ...this.props } label={ __( 'Emails will be sent to admin address' ) } />
			</FormFieldset>
		)
	}
} );

export const SingleSignOnSettings = React.createClass( {
	render() {
		return (
			<FormFieldset>
				<ModuleOptionBoolean option_name={ 'jetpack_sso_require_two_step' } { ...this.props } label={ __( 'Require Two-Step Authentication' ) } />
				<ModuleOptionBoolean option_name={ 'jetpack_sso_match_by_email' } { ...this.props } label={ __( 'Match By Email' ) } />
			</FormFieldset>
		)
	}
} );
