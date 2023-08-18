import {
	getJetpackExtensionAvailability,
	isUpgradable,
	getJetpackData,
	getSiteFragment,
} from '@automattic/jetpack-shared-extension-utils';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

const republicizeFeatureName = 'republicize';

/**
 * Hook that provides various elements of Publicize configuration,
 * whether it's enabled, and whether resharing is available.
 *
 * @returns { object } The various flags and togglePublicizeFeature,
 * for toggling support for the current post.
 */
export default function usePublicizeConfig() {
	const { togglePublicizeFeature } = useDispatch( 'jetpack/publicize' );
	const sharesData = getJetpackData()?.social?.sharesData ?? {};
	const isShareLimitEnabled = sharesData.is_share_limit_enabled;
	const isRePublicizeFeatureAvailable =
		getJetpackExtensionAvailability( republicizeFeatureName )?.available || isShareLimitEnabled;
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );
	const isPostAlreadyShared = useSelect(
		select => select( 'jetpack/publicize' ).getJetpackSocialPostAlreadyShared(),
		[]
	);
	const connectionsRootUrl =
		getJetpackData()?.social?.publicizeConnectionsUrl ??
		'https://wordpress.com/marketing/connections/';

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
	 * isRePublicizeUpgradableViaUpsell:
	 * True when the republicize feature is upgradable according to the store product (republicize),
	 * but also whether the upgrade nudge is enable
	 * in the site context/platform (Simple, Atomic, Jetpack, etc...).
	 *
	 * This is now badly named as it includes the feature flag check which makes the republicize free
	 * when enabled. These checks will be removed once we roll that feature to everyone.
	 */
	const isRePublicizeUpgradableViaUpsell =
		isUpgradable( republicizeFeatureName ) && ! isRePublicizeFeatureAvailable;

	/*
	 * isPublicizeEnabled:
	 * Althought the feature is enabled by the post meta,
	 * it also depends on whether the product feature.
	 * Also, it's tied to the post status (draft, published, etc.).
	 */
	const isPublicizeEnabled = isPostPublished
		? isRePublicizeFeatureAvailable
		: isPublicizeEnabledMeta;

	/*
	 * isPublicizeDisabledBySitePlan:
	 * Depending on the site plan and type, the republicize feature
	 * would get dissabled.
	 */
	const isPublicizeDisabledBySitePlan = isPostPublished && isRePublicizeUpgradableViaUpsell;

	/*
	 * hidePublicizeFeature:
	 * When the site doesn't have the feature available
	 * because of the lack of site plan and/or product,
	 * when it is not upgradable via an upsell,
	 * and when the post is already published,
	 * it needs to hide part of the Publicize feature.
	 */
	const hidePublicizeFeature = isPostPublished && ! isRePublicizeFeatureAvailable;

	/**
	 * hasPaidPlan:
	 * Whether the site has a paid plan. This could be either the Basic or the Advanced plan.
	 */
	const hasPaidPlan = !! getJetpackData()?.social?.hasPaidPlan;

	/**
	 * isEnhancedPublishingEnabled:
	 * Whether the site has the enhanced publishing feature enabled. If true, it means that
	 * the site has the Advanced plan.
	 */
	const isEnhancedPublishingEnabled = !! getJetpackData()?.social?.isEnhancedPublishingEnabled;

	return {
		isPublicizeEnabledMeta,
		isPublicizeEnabled,
		togglePublicizeFeature,
		isPublicizeDisabledBySitePlan,
		isRePublicizeFeatureAvailable,
		isRePublicizeUpgradableViaUpsell,
		hidePublicizeFeature,
		isShareLimitEnabled,
		isPostAlreadyShared,
		numberOfSharesRemaining: sharesData.shares_remaining,
		shouldShowAdvancedPlanNudge: sharesData.show_advanced_plan_upgrade_nudge,
		hasPaidPlan,
		isEnhancedPublishingEnabled,
		isSocialImageGeneratorAvailable: !! getJetpackData()?.social?.isSocialImageGeneratorAvailable,
		isSocialImageGeneratorEnabled: !! getJetpackData()?.social?.isSocialImageGeneratorEnabled,
		connectionsAdminUrl: connectionsRootUrl + getSiteFragment(),
		adminUrl: getJetpackData()?.social?.adminUrl,
	};
}
