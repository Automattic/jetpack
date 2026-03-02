export interface PublicizeConfig {
	isPublicizeEnabledMeta: boolean;
	isPublicizeEnabled: boolean;
	togglePublicizeFeature: VoidFunction;
	isPublicizeDisabledBySitePlan: boolean;
	isRePublicizeFeatureAvailable: boolean;
	isRePublicizeUpgradableViaUpsell: boolean;
	hidePublicizeFeature: boolean;
	isPostAlreadyShared: boolean;
	isSocialImageGeneratorEnabled: boolean;
	needsUserConnection: boolean;
}
