export type Plan = {
	product_id: number;
	product_name: string;
	product_slug: string;
};

export type PlanStateProps = {
	plans: Array< Plan >;
	features: {
		aiAssistant?: AIFeatureProps;
	};
};

// AI Assistant feature props
export type UpgradeTypeProp = 'vip' | 'default';
export type AIFeatureProps = {
	hasFeature: boolean;
	isOverLimit: boolean;
	requestsCount: number;
	requestsLimit: number;
	requireUpgrade: boolean;
	errorMessage: string;
	errorCode: string;
	upgradeType: UpgradeTypeProp;
	currentTier: {
		value: 0 | 1 | 100 | 200 | 500;
	};
	usagePeriod: {
		currentStart: string;
		nextStart: string;
		requestsCount: number;
	};
};
