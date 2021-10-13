/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/*
 * Internal dependencies
 */
import getJetpackExtensionAvailability from '../../../../shared/get-jetpack-extension-availability';
import { isUpgradable } from '../../../../shared/plan-utils';

const republicizeFeatureName = 'republicize';

export default function usePublicizeConfig() {
	// Actions.
	const { togglePublicizeFeature } = useDispatch( 'jetpack/publicize' );
	const { available } = getJetpackExtensionAvailability( republicizeFeatureName );

	// Data.
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
		isRePublicizeFeatureUpgradable: isUpgradable( republicizeFeatureName ),
	};
}
