import { Button, Notice } from '@automattic/jetpack-components';
import { usePageCacheErrorDS, useRunPageCacheSetupAction } from '$lib/stores/page-cache';
import getErrorData from './lib/get-error-data';

const Health = () => {
	const pageCacheError = usePageCacheErrorDS();
	const runPageCacheSetupAction = useRunPageCacheSetupAction();

	const requestRunSetup = () => {
		runPageCacheSetupAction.mutate();
	};

	// Was there a problem trying to setup cache?
	if ( pageCacheError !== '' ) {
		const errorCode = pageCacheError ? pageCacheError : '';

		const errorData = getErrorData( errorCode );
		if ( errorData ) {
			return (
				<>
					<Notice level="warning" hideCloseButton={ true } title={ errorData.title }>
						{ errorData.message }
					</Notice>
					<Button size="small" weight="regular" onClick={ requestRunSetup }>
						I`ve fixed the errors, run setup again.
					</Button>
				</>
			);
		}
	}

	return null;
};

export default Health;
