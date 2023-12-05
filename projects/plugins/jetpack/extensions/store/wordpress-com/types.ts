export type Plan = {
	product_id: number;
	product_name: string;
	product_slug: string;
};
// AI Assistant feature props
export type UpgradeTypeProp = 'vip' | 'default';

export type TierUnlimitedProps = {
	slug: 'ai-assistant-tier-unlimited';
	limit: 999999999;
	value: 1;
	readableLimit: string;
};

export type TierFreeProps = {
	slug: 'ai-assistant-tier-free';
	limit: 20;
	value: 0;
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

export type Tier750Props = {
	slug: 'ai-assistant-tier-750';
	limit: 750;
	value: 750;
};

export type Tier1000Props = {
	slug: 'ai-assistant-tier-1000';
	limit: 1000;
	value: 1000;
};

export type TierProp = {
	slug: TierSlugProp;
	limit: TierLimitProp;
	value: TierValueProp;
	readableLimit?: string;
};

export type TierLimitProp =
	| TierUnlimitedProps[ 'limit' ]
	| TierFreeProps[ 'limit' ]
	| Tier100Props[ 'limit' ]
	| Tier200Props[ 'limit' ]
	| Tier500Props[ 'limit' ]
	| Tier750Props[ 'limit' ]
	| Tier1000Props[ 'limit' ];

export type TierSlugProp =
	| TierUnlimitedProps[ 'slug' ]
	| TierFreeProps[ 'slug' ]
	| Tier100Props[ 'slug' ]
	| Tier200Props[ 'slug' ]
	| Tier500Props[ 'slug' ]
	| Tier750Props[ 'slug' ]
	| Tier1000Props[ 'slug' ];

export type TierValueProp =
	| TierUnlimitedProps[ 'value' ]
	| TierFreeProps[ 'value' ]
	| Tier100Props[ 'value' ]
	| Tier200Props[ 'value' ]
	| Tier500Props[ 'value' ]
	| Tier750Props[ 'value' ]
	| Tier1000Props[ 'value' ];

export type AiFeatureProps = {
	hasFeature: boolean;
	isOverLimit: boolean;
	requestsCount: number;
	requestsLimit: number;
	requireUpgrade: boolean;
	errorMessage?: string;
	errorCode?: string;
	upgradeType: UpgradeTypeProp;
	currentTier?: TierProp;
	usagePeriod?: {
		currentStart: string;
		nextStart: string;
		requestsCount: number;
	};
	nextTier?: TierProp | null;
	tierPlansEnabled?: boolean;
};

// Type used in the `wordpress-com/plans` store.
export type AiFeatureStateProps = AiFeatureProps & {
	_meta?: {
		isRequesting: boolean;
		asyncRequestCountdown: number;
		asyncRequestTimerId: number;
	};
};

export type PlanStateProps = {
	plans: Array< Plan >;
	features: {
		aiAssistant?: AiFeatureStateProps;
	};
};
