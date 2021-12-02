/**
 * External dependencies
 */
import React, { useState, useCallback } from 'react';
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
import restApi from '@automattic/jetpack-api';
import { updateUserLicensesCounts as updateUserLicensesCountsAction } from 'state/licensing';

const License = ( { errorNotice, successNotice, updateUserLicensesCounts } ) => {
	const [ isSaving, setIsSaving ] = useState( false );
	const [ licenseKeyText, setLicenseKeyText ] = useState( '' );

	const handleInputChange = useCallback( event => {
		setLicenseKeyText( event.target.value );
	}, [] );

	const saveJetpackLicense = useCallback( () => {
		if ( ! licenseKeyText || isSaving ) {
			return;
		}

		setIsSaving( true );

		restApi
			.updateLicenseKey( licenseKeyText )
			.then( () => {
				updateUserLicensesCounts();
				successNotice(
					__(
						'Jetpack license key added. It may take a minute for the license to be processed.',
						'jetpack'
					)
				);

				setIsSaving( false );
				setLicenseKeyText( '' );
			} )
			.catch( () => {
				errorNotice( __( 'Error adding Jetpack license key.', 'jetpack' ) );
				setIsSaving( false );
			} );
	}, [ errorNotice, successNotice, isSaving, licenseKeyText, updateUserLicensesCounts ] );

	return (
		<div className="jp-landing__plan-features-header-jetpack-license">
			<h3>{ __( 'Jetpack License', 'jetpack' ) }</h3>
			<p>
				{ __(
					'If you have a Jetpack license key paste it here to queue it for activation. Once your license is processed your product will appear under "My Plan".',
					'jetpack'
				) }
			</p>
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
					? _x( 'Applying…', 'Button caption', 'jetpack' )
					: _x( 'Apply license', 'Button caption', 'jetpack' ) }
			</Button>
		</div>
	);
};

export default connect( null, {
	errorNotice: errorNoticeAction,
	successNotice: successNoticeAction,
	updateUserLicensesCounts: updateUserLicensesCountsAction,
} )( License );
