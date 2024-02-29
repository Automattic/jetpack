import { __ } from '@wordpress/i18n';
import Meta from '$features/page-cache/meta/meta';
import Health from '$features/page-cache/health/health';
import { PageCacheError, usePageCacheSetup } from '$lib/stores/page-cache';
import ErrorBoundary from '$features/error-boundary/error-boundary';
import ErrorNotice from '$features/error-notice/error-notice';
import { MutationNotice } from '$features/ui';

type Props = {
	setup: ReturnType< typeof usePageCacheSetup >;
	error?: PageCacheError;
};

const PageCache = ( { setup, error }: Props ) => {
	return (
		<>
			<MutationNotice
				mutationId="page-cache-setup"
				isPending={ setup.isPending }
				isError={ setup.isError }
				isSuccess={ setup.isSuccess && ! error }
				savingMessage={ __( 'Setting up cache…', 'jetpack-boost' ) }
				errorMessage={ __( 'An error occurred while setting up cache.', 'jetpack-boost' ) }
				successMessage={ __( 'Cache setup complete.', 'jetpack-boost' ) }
			/>
			{ error ? <Health setupCache={ () => setup.mutate() } error={ error } /> : <Meta /> }
		</>
	);
};

export default ( props: Props ) => {
	return (
		<ErrorBoundary
			fallback={
				<ErrorNotice
					title={ __( 'Error', 'jetpack-boost' ) }
					error={ new Error( __( 'Unable to load Cache settings.', 'jetpack-boost' ) ) }
				/>
			}
		>
			<PageCache { ...props } />
		</ErrorBoundary>
	);
};
