export type paidFeaturesProp = {
	isVideoPress1TBSupported: boolean;
	isVideoPressSupported: boolean;
	isVideoPressUnlimitedSupported: boolean;
};

export type siteProductOriginalProps = {
	title: string;
	name: string;
	description: string;
	long_description?: string;
	features: Array< string >;
	has_required_plan: boolean;
	is_bundle?: boolean;
	is_upgradable_by_bundle?: boolean;
	manage_url?: string;
	plugin_slug: string;
	post_activation_url?: string;
	pricing_for_ui: {
		available: boolean;
		currency_code: string;
		discount_price: number;
		full_price: number;
		wpcom_product_slug: string;
	};
	requires_user_connection: boolean;
	slug: string;
	status: string;
	supported_products: Array< string >;
	wpcom_product_slug: string;
};

export type productOriginalProps = {
	product_id: number;
	product_name: string;
	product_slug: 'jetpack_videopress';
	description: string;
	available: boolean;
	billing_product_slug: 'jetpack-videopress';
	is_domain_registration: false;
	cost_display: string;
	combined_cost_display: string;
	cost: number;
	cost_smallest_unit: number;
	currency_code: string;
	product_term: string;
	price_tier_slug: string;
	introductory_offer: {
		interval_unit: string;
		interval_count: number;
		cost_per_interval: number;
		transition_after_renewal_count: number;
		should_prorate_when_offer_ends: boolean;
	};
};

export type siteProductProps = {
	title: string;
	name: string;
	description: string;
	longDescription?: string;
	features: Array< string >;
	hasRequiredPlan: boolean;
	isBundle?: boolean;
	isUpgradableByBundle?: boolean;
	manageUrl?: string;
	pluginSlug: string;
	postActivationUrl?: string;
	pricingForUi: {
		available: boolean;
		currencyCode: string;
		discountPrice: number;
		fullPrice: number;
	};
	requiresUserConnection: boolean;
	slug: string;
	status: string;
	supportedProducts: Array< string >;
	wpcomProductSlug: string;
};

export type productProps = {
	productId: number;
	productName: string;
	productSlug: 'jetpack_videopress';
	description: string;
	available: boolean;
	billingProductSlug: 'jetpack-videopress';
	isDomainRegistration: false;
	costDisplay: string;
	combinedCostDisplay: string;
	cost: number;
	costSmallestUnit: number;
	currencyCode: string;
	productTerm: string;
	priceTierSlug: string;
	introductoryOffer: {
		intervalUnit: string;
		intervalCount: number;
		costPerInterval: number;
		transitionAfterRenewalCount: number;
		shouldProrateWhenOfferEnds: boolean;
	};
};

export type useVideoPressSettingsProps = {
	settings: {
		videoPressVideosPrivateForSite: boolean;
	};
	onUpdate: ( settings: { videoPressVideosPrivateForSite: boolean } ) => void;
};
