import { useSingleModuleState } from '$features/module/lib/stores';
import { useAsyncSuperCacheAction, usePageCacheSetup } from '$lib/stores/page-cache';
import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';

const SwitchToBoost = () => {
	const disableSuperCache = useAsyncSuperCacheAction();
	const pageCacheSetup = usePageCacheSetup();
	const [ , enableCache ] = useSingleModuleState( 'page_cache', () => {
		pageCacheSetup.mutate();
	} );

	const switchToBoost = useCallback( async () => {
		await disableSuperCache.mutateAsync();
		enableCache( true );
	}, [ disableSuperCache, enableCache ] );

	return (
		<Button onClick={ switchToBoost }>{ __( 'Switch to Boost Cache', 'jetpack-boost' ) }</Button>
	);
};

export default SwitchToBoost;
