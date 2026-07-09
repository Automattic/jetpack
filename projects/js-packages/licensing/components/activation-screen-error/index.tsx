import jetpackAnalytics from '@automattic/jetpack-analytics';
import { Notice, Stack, Text } from '@wordpress/ui';
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

	const isLicenseAlreadyAttached = LICENSE_ERRORS.ACTIVE_ON_SAME_SITE === errorType;

	return (
		<Notice.Root
			className="activation-screen-error"
			intent={ isLicenseAlreadyAttached ? 'success' : 'error' }
		>
			<Stack direction="column" gap="sm">
				<Text>{ errorMessage }</Text>
				{ errorInfo }
			</Stack>
		</Notice.Root>
	);
};

export default ActivationScreenError;
