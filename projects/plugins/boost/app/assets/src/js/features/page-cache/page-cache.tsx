import Meta from '$features/page-cache/meta/meta';
import Health from '$features/page-cache/health/health';
import { usePageCacheErrorDS } from '$lib/stores/page-cache';

const PageCache = () => {
	const pageCacheError = usePageCacheErrorDS();

	return <>{ pageCacheError ? <Health error={ pageCacheError } /> : <Meta /> }</>;
};

export default PageCache;
