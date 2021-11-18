/**
 * External dependencies
 */
import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import restApi from '@automattic/jetpack-api';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ActivationScreenControls from '../activation-screen-controls';
import ActivationScreenIllustration from '../activation-screen-illustration';
import ActivationScreenSuccessInfo from '../activation-screen-success-info';

/**
 * Style dependencies
 */
import './style.scss';

/**
 * attachLicenses has a particular result, which we reduce to the parts we care about here
 *
 * @param { attachLicenses } result
 */
const parseAttachLicenseResult = result => {
	let currentResult = result;

	while ( Array.isArray( currentResult ) && currentResult.length > 0 ) {
		currentResult = currentResult[ 0 ];
	}

	if ( currentResult?.activatedProductId ) {
		return activatedProductId;
	} else if ( currentResult?.errors ) {
		for ( let errorCode in currentResult.errors ) {
			if ( currentResult.errors[ errorCode ].length > 0 ) {
				throw new Error( currentResult.errors[ errorCode ][ 0 ] );
			}
		}
	}

	throw new Error(
		__( 'An unknown error occurred during license activation. Please try again.', 'jetpack' )
	);
};

/**
 * The Activation Screen component.
 *
 * @param {object} props -- The properties.
 * @param {string} props.assetBaseUrl -- The assets base URL.
 * @param {string} props.lockImage -- Image to display within the illustration.
 * @param {function?} props.onActivationSuccess -- A function to call on success.
 * @param {string} props.siteRawUrl -- url of the Jetpack Site
 * @param {string?} props.startingLicense -- pre-fill the license value
 * @param {string} props.successImage -- Image to display within the illustration.
 * @returns {React.Component} The `ActivationScreen` component.
 */
const ActivationScreen = props => {
	const {
		assetBaseUrl,
		lockImage,
		onActivationSuccess = () => null,
		siteRawUrl,
		startingLicense,
		successImage,
	} = props;

	const [ license, setLicense ] = useState( startingLicense ?? '' );
	const [ licenseError, setLicenseError ] = useState( null );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ activatedProduct, setActivatedProduct ] = useState( null );

	const activateLicense = useCallback( () => {
		if ( ! license || isSaving ) {
			return Promise.resolve();
		}
		setIsSaving( true );
		// returning our promise chain makes testing a bit easier ( see ./test/components.jsx - "should render an error from API" )
		return restApi
			.attachLicenses( [ license ] )
			.then( result => {
				const activatedProductId = parseAttachLicenseResult( result );
				setActivatedProduct( activatedProductId );
				onActivationSuccess();
			} )
			.catch( error => {
				setLicenseError( error.message );
			} )
			.finally( () => {
				setIsSaving( false );
			} );
	}, [ isSaving, license ] );

	const renderActivationSuccess = () => (
		<div className="jp-license-activation-screen">
			<ActivationScreenSuccessInfo siteRawUrl={ siteRawUrl } productId={ activatedProduct } />
			<ActivationScreenIllustration
				imageUrl={ assetBaseUrl + successImage }
				showSupportLink={ false }
			/>
		</div>
	);

	const renderActivationControl = () => (
		<div className="jp-license-activation-screen">
			<ActivationScreenControls
				license={ license }
				onLicenseChange={ setLicense }
				activateLicense={ activateLicense }
				siteUrl={ siteRawUrl }
				licenseError={ licenseError }
				disabled={ isSaving }
			/>
			<ActivationScreenIllustration imageUrl={ assetBaseUrl + lockImage } showSupportLink />
		</div>
	);

	return null !== activatedProduct ? renderActivationSuccess() : renderActivationControl();
};

ActivationScreen.propTypes = {
	assetBaseUrl: PropTypes.string.isRequired,
	lockImage: PropTypes.string.isRequired,
	onActivationSuccess: PropTypes.func,
	siteRawUrl: PropTypes.string.isRequired,
	startingLicense: PropTypes.string,
	successImage: PropTypes.string.isRequired,
};

export { ActivationScreen as default, parseAttachLicenseResult };
