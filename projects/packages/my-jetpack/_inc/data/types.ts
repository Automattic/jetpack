export type BackupRewindableEvent = {
	last_rewindable_event?: {
		gridicon: string;
		summary: string;
		published: string;
	};
	undo_backup_id?: string;
};

export type BackupCountStats = {
	total_post_count: number;
	total_page_count: number;
	total_comment_count: number;
	total_image_count: number;
	total_video_count: number;
	total_audio_count: number;
};

export type ProductCamelCase = {
	class: string;
	description: string;
	disclaimers: Array< string[] >;
	features: string[];
	featuresByTier: Array< string >;
	hasRequiredPlan: boolean;
	hasRequiredTier: Array< string >;
	hasPaidPlanForProduct: boolean;
	isBundle: boolean;
	isPluginActive: boolean;
	isUpgradableByBundle: string[];
	longDescription: string;
	manageUrl: string;
	name: string;
	pluginSlug: string;
	postActivationUrl: string;
	postCheckoutUrl?: string;
	pricingForUi?: {
		available: boolean;
		wpcomProductSlug: string;
		productTerm: string;
		currencyCode: string;
		fullPrice: number;
		discountPrice: number;
		couponDiscount: number;
		isIntroductoryOffer: boolean;
		fullPricePerMonth?: number;
		discountPricePerMonth?: number;
		introductoryOffer?: {
			costPerInterval: number;
			intervalCount: number;
			intervalUnit: string;
			shouldProrateWhenOfferEnds: boolean;
			transitionAfterRenewalCount: number;
			usageLimit?: number;
		};
	};
	purchaseUrl?: string;
	requiresUserConnection: boolean;
	slug: string;
	standalonePluginInfo: {
		hasStandalonePlugin: boolean;
		isStandaloneInstalled: boolean;
		isStandaloneActive: boolean;
	};
	status: string;
	supportedProducts: string[];
	tiers: string[];
	title: string;
	wpcomProductSlug: string;
};

type StateProducts = Window[ 'myJetpackInitialState' ][ 'products' ][ 'items' ];
export type ProductSnakeCase = StateProducts[ string ];
