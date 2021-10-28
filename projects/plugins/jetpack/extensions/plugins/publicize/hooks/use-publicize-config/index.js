/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/*
 * Internal dependencies
 */
import getJetpackExtensionAvailability from '../../../../shared/get-jetpack-extension-availability';
import { isUpgradable, isUpgradeNudgeEnabled } from '../../../../shared/plan-utils';

const republicizeFeatureName = 'republicize';

export default function usePublicizeConfig() {
	const { togglePublicizeFeature } = useDispatch( 'jetpack/publicize' );
	const { available } = getJetpackExtensionAvailability( republicizeFeatureName );

	const isPublicizeEnabled = useSelect(
		select => select( 'jetpack/publicize' ).getFeatureEnableState(),
		[]
	);

	return {
		isRePublicizeFeatureEnabled: !! window?.Jetpack_Editor_Initial_State.jetpack
			?.republicize_enabled,
		isPublicizeEnabled,
		togglePublicizeFeature,
		isRePublicizeFeatureAvailable: available,
		isRePublicizeUpgradableViaUpsell:
			isUpgradable( republicizeFeatureName ) && isUpgradeNudgeEnabled(),
	};
}
