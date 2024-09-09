/**
 * My Jetpack Product Data Types
 *
 * Borrowed from projects/packages/my-jetpack/global.d.ts
 */
type ProductStatus =
	| 'active'
	| 'inactive'
	| 'module_disabled'
	| 'site_connection_error'
	| 'plugin_absent'
	| 'plugin_absent_with_plan'
	| 'needs_plan'
	| 'needs_activation'
	| 'needs_first_site_connection'
	| 'user_connection_error'
	| 'can_upgrade';

export type ProductData = {
	class: string;
	description: string;
	disclaimers: Array< string[] >;
	features: string[];
	has_free_offering: boolean;
	has_paid_plan_for_product: boolean;
	features_by_tier: Array< string >;
	is_bundle: boolean;
	is_plugin_active: boolean;
	is_upgradable: boolean;
	is_upgradable_by_bundle: string[];
	long_description: string;
	manage_url: string;
	name: string;
	plugin_slug: string;
	post_activation_url: string;
	post_checkout_url?: string;
	pricing_for_ui?: {
		available: boolean;
		wpcom_product_slug: string;
		wpcom_free_product_slug?: string;
		product_term: string;
		currency_code: string;
		full_price: number;
		discount_price: number;
		coupon_discount: number;
		is_introductory_offer: boolean;
		introductory_offer?: {
			cost_per_interval: number;
			interval_count: number;
			interval_unit: string;
			should_prorate_when_offer_ends: boolean;
			transition_after_renewal_count: number;
			usage_limit?: number;
		};
		tiers?: {
			[ key: string ]: {
				available: boolean;
				currencyCode: string;
				discountPrice: number;
				fullPrice: number;
				introductoryOffer?: {
					costPerInterval: number;
					intervalCount: number;
					intervalUnit: string;
					shouldProrateWhenOfferEnds: boolean;
					transitionAfterRenewalCount: number;
					usageLimit?: number;
				};
				isIntroductoryOffer: boolean;
				productTerm: string;
				wpcomProductSlug: string;
				quantity: number;
			};
		};
	};
	purchase_url?: string;
	requires_user_connection: boolean;
	slug: string;
	standalone_plugin_info: {
		has_standalone_plugin: boolean;
		is_standalone_installed: boolean;
		is_standalone_active: boolean;
	};
	status: ProductStatus;
	supported_products: string[];
	tiers: string[];
	title: string;
	wpcom_product_slug: string;
};
