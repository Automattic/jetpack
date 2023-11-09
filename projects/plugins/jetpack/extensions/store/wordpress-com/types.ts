export type Plan = {
	product_id: number;
	product_name: string;
	product_slug: string;
};
// AI Assistant feature props
export type UpgradeTypeProp = 'vip' | 'default';

export type TierUnlimitedProps = {
	slug: 'ai-assistant-tier-unlimited';
	limit: 9223372036854776000n;
	value: 1;
	readableLimit: 'Unlimited';
};

export type TierFreeProps = {
	slug: 'ai-assistant-tier-free';
	limit: 20;
	value: 20;
};

export type Tier100Props = {
	slug: 'ai-assistant-tier-100';
	limit: 100;
	value: 100;
};

export type Tier200Props = {
	slug: 'ai-assistant-tier-200';
	limit: 200;
	value: 200;
};

export type Tier500Props = {
	slug: 'ai-assistant-tier-500';
	limit: 500;
	value: 500;
};

export type TierSlugProp =
	| TierUnlimitedProps[ 'slug' ]
	| TierFreeProps[ 'slug' ]
	| Tier100Props[ 'slug' ]
	| Tier200Props[ 'slug' ]
	| Tier500Props[ 'slug' ];
export type TierValueProp =
	| TierUnlimitedProps[ 'value' ]
	| TierFreeProps[ 'value' ]
	| Tier100Props[ 'value' ]
	| Tier200Props[ 'value' ]
	| Tier500Props[ 'value' ];

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
	nextTier: {
		slug: TierSlugProp;
		value: TierValueProp;
		limit?: number;
		redeableLimit?: string;
	};
};

// Type used in the `wordpress-com/plans` store.
export type AiFeatureStateProps = AiFeatureProps & {
	_meta?: {
		isRequesting: boolean;
	};
};

export type PlanStateProps = {
	plans: Array< Plan >;
	features: {
		aiAssistant?: AiFeatureStateProps;
	};
};
