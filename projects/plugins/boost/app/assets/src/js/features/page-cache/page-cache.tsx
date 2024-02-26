import { __ } from '@wordpress/i18n';
import Meta from '$features/page-cache/meta/meta';
import Health from '$features/page-cache/health/health';
import { usePageCacheError, usePageCacheSetup } from '$lib/stores/page-cache';
import ErrorBoundary from '$features/error-boundary/error-boundary';
import ErrorNotice from '$features/error-notice/error-notice';
import { MutationNotice } from '$features/ui';
import { useEffect } from 'react';

const PageCache = () => {
	const pageCacheSetup = usePageCacheSetup();
	const [ pageCacheError ] = usePageCacheError();

	return (
		<>
			<MutationNotice
				isPending={ pageCacheSetup.isPending }
				isError={ pageCacheSetup.isError }
				isSuccess={ pageCacheSetup.isSuccess && ! pageCacheError.data }
				savingMessage={ __( 'Setting up cache…', 'jetpack-boost' ) }
				errorMessage={ __( 'An error occurred while setting up cache.', 'jetpack-boost' ) }
				successMessage={ __( 'Cache setup complete.', 'jetpack-boost' ) }
			/>
			{ pageCacheError.data ? (
				<Health
					setupCache={ () => pageCacheSetup.mutate() }
					error={ pageCacheError.data.message }
				/>
			) : (
				<Meta />
			) }
		</>
	);
};

export default () => {
	return (
		<ErrorBoundary
			fallback={
				<ErrorNotice
					title={ __( 'Error', 'jetpack-boost' ) }
					error={ new Error( __( 'Unable to load Cache settings.', 'jetpack-boost' ) ) }
				/>
			}
		>
			<PageCache />
		</ErrorBoundary>
	);
};
