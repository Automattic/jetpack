export interface PublicizeConfig {
	isPublicizeEnabled: boolean;
	togglePublicizeFeature: VoidFunction;
	isPublicizeDisabledBySitePlan: boolean;
	isRePublicizeFeatureAvailable: boolean;
	isRePublicizeUpgradableViaUpsell: boolean;
	hidePublicizeFeature: boolean;
	isPostAlreadyShared: boolean;
	needsUserConnection: boolean;
}
