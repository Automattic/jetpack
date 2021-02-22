/**
 * External dependencies
 */
import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { connect } from 'react-redux';


/**
 * Internal dependencies
 */
import TextInput from 'components/text-input';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';

class License extends Component {
	render() {
		return (
			<div className="">
				<h3 className="">{ __( "Jetpack License", 'jetpack' ) }</h3>
				<p className="" onClick= { console.log(this.props.getOptionValue( 'jetpack_licenses' ) ) }>
					{ __( 'If you have a Jetpack License from a plan purchased through a partner, add it here.', 'jetpack' ) }
				</p>
					<TextInput
						name="jetpack_license_key"
						placeholder={ __('Jetpack Licence', 'jetpack') }
						className="code"
					/>
			</div>
		);
	}

}

export default connect( state => {
	return {
	}
} )( withModuleSettingsFormHelpers(License) );
