import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

const republicizeFeatureName = 'republicize';

export default function usePublicizeConfig() {
	const { togglePublicizeFeature } = useDispatch( 'jetpack/publicize' );
	const { available: isRePublicizeFeatureAvailable } = getJetpackExtensionAvailability(
		republicizeFeatureName
	);
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	/*
	 * isPublicizeEnabledMeta:
	 * It's stored in the jetpack_publicize_feature_enabled post metadata,
	 * and usually is handled from the UI (main toggle control),
	 * dispathicng the togglePublicizeFeature() action (jetpack/publicize).
	 */
	const isPublicizeEnabledMeta = useSelect(
		select => select( 'jetpack/publicize' ).getFeatureEnableState(),
		[]
	);

	/*
	 * isRePublicizeFeatureEnabled:
	 * Feature flag, defined by the server-side.
	 * it can be defined via the `jetpack_block_editor_republicize_feature` backend filter.
	 */
	const isRePublicizeFeatureEnabled = !! window?.Jetpack_Editor_Initial_State.jetpack
		?.republicize_enabled;

	/*
	 * isPublicizeEnabled:
	 * Althought the feature is enabled by the post meta,
	 * it also depends on whether the product feature.
	 * Also, it's tied to the post status (draft, published, etc.).
	 */
	const isPublicizeEnabled =
		( isPostPublished && ! isRePublicizeFeatureEnabled ) || isPublicizeEnabledMeta;

	/*
	 * hideRePublicizeFeature:
	 * When the site doesn't have the feature available
	 * because of the lack of site plan and/or product,
	 * when it is not upgradable via an upsell,
	 * and when the post is already published,
	 * it needs to hide part of the Publicize feature.
	 */
	const hideRePublicizeFeature =
		isPostPublished && ! isRePublicizeFeatureAvailable && isRePublicizeFeatureEnabled;

	return {
		isPublicizeEnabledMeta,
		isRePublicizeFeatureEnabled,
		isPublicizeEnabled,
		togglePublicizeFeature,
		isRePublicizeFeatureAvailable,
		hideRePublicizeFeature,
	};
}
