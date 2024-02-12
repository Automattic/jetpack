import { Notice } from '@automattic/jetpack-components';
import { usePageCacheErrorDS } from '$lib/stores/page-cache';
import getErrorData from './lib/get-error-data';

const Health = () => {
	const error = usePageCacheErrorDS();

	// Was there a problem trying to setup cache?
	if ( error !== '' ) {
		const errorCode = error ? error : '';

		const diagnosticMessage = getErrorData( errorCode );
		if ( diagnosticMessage ) {
			return (
				<Notice level="warning" hideCloseButton={ true } title={ diagnosticMessage.title }>
					{ diagnosticMessage.message }
				</Notice>
			);
		}
	}

	return null;
};

export default Health;
