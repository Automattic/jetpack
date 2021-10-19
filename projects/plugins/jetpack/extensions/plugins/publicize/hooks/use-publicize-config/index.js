/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

export default function usePublicizeConfig() {
	// Actions.
	const { togglePublicizeFeature } = useDispatch( 'jetpack/publicize' );

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
	};
}
