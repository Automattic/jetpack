export type paidFeaturesProp = {
	isVideoPress1TBSupported: boolean;
	isVideoPressSupported: boolean;
	isVideoPressUnlimitedSupported: boolean;
};

export type productOriginalProps = {
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

export type productProps = {
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

export type usePlanProps = {
	features?: paidFeaturesProp;
	product?: productProps;
};
