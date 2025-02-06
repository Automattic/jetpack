import jetpackAnalytics from '@automattic/jetpack-analytics';
import { Icon, warning, check } from '@wordpress/icons';
import React, { useEffect } from 'react';
import { LICENSE_ERRORS } from './constants';
import { useGetErrorContent } from './use-get-error-content';
import type { FC } from 'react';

import './style.scss';

type LicenseErrorKeysType = keyof typeof LICENSE_ERRORS;
type LicenseErrorValuesType = ( typeof LICENSE_ERRORS )[ LicenseErrorKeysType ];

interface Props {
	licenseError: string;
	errorType: LicenseErrorValuesType;
}

const ActivationScreenError: FC< Props > = ( { licenseError, errorType } ) => {
	useEffect( () => {
		if ( licenseError ) {
			jetpackAnalytics.tracks.recordEvent( 'jetpack_wpa_license_activation_error_view', {
				error: licenseError,
				error_type: errorType,
			} );
		}
	}, [ licenseError, errorType ] );

	const { errorMessage, errorInfo } = useGetErrorContent( licenseError, errorType );

	if ( ! licenseError ) {
		return null;
	}

	const { ACTIVE_ON_SAME_SITE } = LICENSE_ERRORS;
	const isLicenseAlreadyAttached = ACTIVE_ON_SAME_SITE === errorType;

	const errorMessageClass = isLicenseAlreadyAttached
		? 'activation-screen-error__message--success'
		: 'activation-screen-error__message--error';

	return (
		<>
			<div className={ `activation-screen-error__message ${ errorMessageClass }` }>
				<Icon icon={ isLicenseAlreadyAttached ? check : warning } size={ 20 } />
				<span>{ errorMessage }</span>
			</div>
			{ errorInfo && <div className="activation-screen-error__info">{ errorInfo }</div> }
		</>
	);
};

export default ActivationScreenError;
