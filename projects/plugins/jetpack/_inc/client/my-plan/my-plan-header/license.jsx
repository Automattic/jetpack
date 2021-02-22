/**
 * External dependencies
 */
import React, { Component } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import TextInput from 'components/text-input';

class License extends Component {
	state = {
		isSaving: false,
		licenseKeyText: '',
	};

	handleInputChange = event => {
		this.setState( { licenseKeyText: event.target.value } );
	};

	saveJetpackLicense = () => {
		if ( ! this.state.licenseKeyText || this.state.isSaving ) {
			return;
		}

		this.setState( { isSaving: true } );

		apiFetch( {
			path: '/jetpack/v4/licensing/set-license',
			method: 'POST',
			data: {
				license: this.state.licenseKeyText,
			},
		} ).then( () => {
			this.setState( { isSaving: false, licenseKeyText: '' } );
		} );
	};

	render() {
		return (
			<div className="jp-landing__plan-features-header-jetpack-license">
				<h3>{ __( 'Jetpack License', 'jetpack' ) }</h3>
				<p>{ __( 'If you have a Jetpack License Key add it here.', 'jetpack' ) }</p>
				<TextInput
					name="jetpack_license_key"
					className="code"
					value={ this.state.licenseKeyText }
					placeholder={ __( 'Jetpack Licence Key', 'jetpack' ) }
					disabled={ this.state.isSaving }
					onChange={ this.handleInputChange }
				/>
				<Button primary compact onClick={ this.saveJetpackLicense }>
					{ this.state.isSaving
						? _x( 'Saving…', 'Button caption', 'jetpack' )
						: _x( 'Save license', 'Button caption', 'jetpack' ) }
				</Button>
			</div>
		);
	}
}

export default License;
