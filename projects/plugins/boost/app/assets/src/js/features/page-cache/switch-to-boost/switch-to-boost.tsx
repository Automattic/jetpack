import { useAsyncSuperCacheAction } from '$lib/stores/page-cache';
import { recordBoostEvent } from '$lib/utils/analytics';
import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';

type Props = {
	onSwitch: () => void;
};

const SwitchToBoost = ( { onSwitch }: Props ) => {
	const disableSuperCache = useAsyncSuperCacheAction();

	const switchToBoost = useCallback( async () => {
		disableSuperCache.mutate( undefined, {
			onSuccess: () => {
				onSwitch();
				recordBoostEvent( 'switch_to_boost_cache', { type: 'confirmed' } );
			},
		} );
	}, [ disableSuperCache, onSwitch ] );

	return (
		<Button variant="secondary" onClick={ switchToBoost }>
			{ __( 'Switch to Boost Cache', 'jetpack-boost' ) }
		</Button>
	);
};

export default SwitchToBoost;
