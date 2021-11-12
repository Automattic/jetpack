/**
 * External dependencies
 */
import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

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
 * The Activation Screen component.
 *
 * @param {object} props -- The properties.
 * @param {string} props.assetBaseUrl -- The assets base URL.
 * @param {string} props.lockImage -- Image to display within the illustration.
 * @param {string} props.siteRawUrl -- url of the Jetpack Site
 * @param {string} props.successImage -- Image to display within the illustration.
 * @returns {React.Component} The `ActivationScreen` component.
 */
const ActivationScreen = props => {
	const { assetBaseUrl, lockImage, siteRawUrl, successImage } = props;

	const [ license, setLicense ] = useState( '' );
	const [ licenseError, setLicenseError ] = useState( null );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ activatedProduct, setActivatedProduct ] = useState( null );

	const activateLicense = useCallback( () => {
		if ( ! license || isSaving ) {
			return;
		}

		setIsSaving( true );

		// TODO: unconnected, will connect via jetpack-api in separate PR
		setTimeout( () => {
			setIsSaving( false );
		}, 5000 );
	}, [ isSaving, license ] );

	const renderActivationSuccess = () => (
		<div className="jp-license-activation-screen">
			<ActivationScreenSuccessInfo
				dashboardUrl={ 'https://cloud.jetpack.com/landing/' + siteRawUrl }
				productId={ activatedProduct }
			/>
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
	assetBaseUrl: PropTypes.string,
	lockImage: PropTypes.string,
	siteRawUrl: PropTypes.string,
	successImage: PropTypes.string,
};

export default ActivationScreen;
