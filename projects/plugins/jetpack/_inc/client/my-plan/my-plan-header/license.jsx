/**
 * External dependencies
 */
import React, { useState, useCallback } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { __, _x } from '@wordpress/i18n';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import TextInput from 'components/text-input';
import {
	successNotice as successNoticeAction,
	errorNotice as errorNoticeAction,
} from 'components/global-notices/state/notices/actions';

const License = ( { successNotice, errorNotice } ) => {
	const [ isSaving, setIsSaving ] = useState( false );
	const [ licenseKeyText, setLicenseKeyText ] = useState( false );

	const handleInputChange = useCallback( event => {
		setLicenseKeyText( event.target.value );
	}, [] );

	const saveJetpackLicense = useCallback( () => {
		if ( ! licenseKeyText || isSaving ) {
			return;
		}

		setIsSaving( true );

		apiFetch( {
			path: '/jetpack/v4/licensing/set-license',
			method: 'POST',
			data: {
				license: licenseKeyText,
			},
		} )
			.then( () => {
				successNotice(
					__(
						'Jetpack license key added. It may take a minute for the license to be processed.',
						'jetpack'
					)
				);
				setIsSaving( true );
				setLicenseKeyText( '' );
			} )
			.catch( () => {
				errorNotice( __( 'Error adding Jetpack license key.', 'jetpack' ) );
				setIsSaving( false );
			} );
	}, [ successNotice, errorNotice, isSaving, licenseKeyText ] );

	return (
		<div className="jp-landing__plan-features-header-jetpack-license">
			<h3>{ __( 'Jetpack License', 'jetpack' ) }</h3>
			<p>{ __( 'If you have a Jetpack license key add it here.', 'jetpack' ) }</p>
			<TextInput
				name="jetpack_license_key"
				className="code"
				value={ licenseKeyText }
				placeholder={ __( 'Jetpack licence key', 'jetpack' ) }
				disabled={ isSaving }
				onChange={ handleInputChange }
			/>
			<Button primary compact onClick={ saveJetpackLicense }>
				{ isSaving
					? _x( 'Saving…', 'Button caption', 'jetpack' )
					: _x( 'Save license', 'Button caption', 'jetpack' ) }
			</Button>
		</div>
	);
};

export default connect( null, {
	createNotice: successNoticeAction,
	errorNotice: errorNoticeAction,
} )( License );
