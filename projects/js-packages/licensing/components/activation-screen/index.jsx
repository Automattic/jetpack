/**
 * External dependencies
 */
import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import restApi from '@automattic/jetpack-api';

/**
 * Internal dependencies
 */
import ActivationScreenControls from '../activation-screen-controls';
import ActivationScreenIllustration from '../activation-screen-illustration';

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
 * @param {string} props.successImage -- Image to display within the illustration.
 * @param {string} props.siteRawUrl
 * @returns {React.Component} The `ActivationScreen` component.
 */
const ActivationScreen = props => {
	const { assetBaseUrl, lockImage, siteRawUrl } = props;

	const [license, setLicense] = useState('');
	const [licenseError, setLicenseError] = useState(null);
	const [isSaving, setIsSaving] = useState(false);

	const activateLicense = useCallback(() => {
		if (!license || isSaving) {
			return;
		}

		setIsSaving(true);

		restApi
			.attachLicenseKey(license)
			.then((...args) => {
				console.log('success');
				console.log(args);

				setIsSaving(false);
				setLicense('');
			})
			.catch(error => {
				setIsSaving(false);
				setLicenseError(error.response.message);
			});
	}, [isSaving, license]);

	return (
		<div className="jp-license-activation-screen">
			<ActivationScreenControls
				license={license}
				onLicenseChange={setLicense}
				activateLicense={activateLicense}
				siteUrl={siteRawUrl}
				licenseError={licenseError}
			/>
			<ActivationScreenIllustration imageUrl={assetBaseUrl + lockImage} />
		</div>
	);
};

ActivationScreen.propTypes = {
	assetBaseUrl: PropTypes.string,
};

export default ActivationScreen;
