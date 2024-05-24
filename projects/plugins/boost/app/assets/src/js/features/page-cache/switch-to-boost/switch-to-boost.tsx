import { useAsyncSuperCacheAction } from '$lib/stores/page-cache';
import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';

type Props = {
	onSwitch: () => void;
};

const SwitchToBoost = ( { onSwitch }: Props ) => {
	const disableSuperCache = useAsyncSuperCacheAction();

	const switchToBoost = useCallback( async () => {
		await disableSuperCache.mutateAsync();
		onSwitch();
	}, [ disableSuperCache, onSwitch ] );

	return (
		<Button onClick={ switchToBoost }>{ __( 'Switch to Boost Cache', 'jetpack-boost' ) }</Button>
	);
};

export default SwitchToBoost;
