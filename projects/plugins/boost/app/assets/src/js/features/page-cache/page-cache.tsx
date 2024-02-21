import { __ } from '@wordpress/i18n';
import Meta from '$features/page-cache/meta/meta';
import Health from '$features/page-cache/health/health';
import { usePageCacheError } from '$lib/stores/page-cache';
import ErrorBoundary from '$features/error-boundary/error-boundary';
import ErrorNotice from '$features/error-notice/error-notice';

const PageCache = () => {
	const pageCacheError = usePageCacheError();

	return <>{ pageCacheError ? <Health error={ pageCacheError } /> : <Meta /> }</>;
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
