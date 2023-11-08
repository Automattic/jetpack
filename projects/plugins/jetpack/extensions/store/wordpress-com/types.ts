export type Plan = {
	product_id: number;
	product_name: string;
	product_slug: string;
};

export type PlanStateProps = {
	plans: Array< Plan >;
	features: {
		aiAssistant?: AiFeatureStateProps;
	};
};

// AI Assistant feature props
export type UpgradeTypeProp = 'vip' | 'default';
export type TierValueProp = 1 | 20 | 100 | 200 | 500;
export type AiFeatureProps = {
	hasFeature: boolean;
	isOverLimit: boolean;
	requestsCount: number;
	requestsLimit: number;
	requireUpgrade: boolean;
	errorMessage: string;
	errorCode: string;
	upgradeType: UpgradeTypeProp;
	currentTier: {
		value: TierValueProp;
	};
	usagePeriod: {
		currentStart: string;
		nextStart: string;
		requestsCount: number;
	};
};

export type AiFeatureStateProps = AiFeatureProps & {
	_meta?: {
		isRequesting: boolean;
	};
};
