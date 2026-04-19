import jetpackAnalytics from '@automattic/jetpack-analytics';
import { Notice } from '@wordpress/ui';
import { useEffect } from 'react';
import { LICENSE_ERRORS } from './constants';
import { useGetErrorContent } from './use-get-error-content';
import type { FC } from 'react';

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

	return (
		<Notice.Root intent={ isLicenseAlreadyAttached ? 'success' : 'error' }>
			<Notice.Title>{ errorMessage }</Notice.Title>
			{ errorInfo && <Notice.Description>{ errorInfo }</Notice.Description> }
		</Notice.Root>
	);
};

export default ActivationScreenError;
