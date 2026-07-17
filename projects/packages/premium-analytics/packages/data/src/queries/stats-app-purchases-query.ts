/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from './stats-app-query';

export type StatsAppPurchasesParams = {
	site?: number | string;
	type?: 'transferred';
};

export type StatsAppPurchaseExpiryStatus =
	| 'active'
	| 'auto-renewing'
	| 'expired'
	| 'expiring'
	| 'included'
	| 'manual-renew'
	| 'one-time-purchase';

export type StatsAppPurchase = {
	ID: number | string;
	amount: number;
	attached_to_purchase_id: number | string | null;
	blog_id: number | string;
	blogname: string;
	currency_code: string;
	currency_symbol: string;
	expiry_date: string;
	expiry_status: StatsAppPurchaseExpiryStatus;
	is_auto_renew_enabled: boolean;
	is_cancelable: boolean;
	is_free_jetpack_stats_product: boolean;
	is_jetpack_plan_or_product: boolean;
	is_jetpack_stats_product: boolean;
	is_plan: boolean;
	is_refundable: boolean;
	is_removable: boolean;
	is_renewable: boolean;
	price_text: string;
	product_id: number | string;
	product_name: string;
	product_slug: string;
	product_type: string;
	site_slug: string;
	subscribed_date: string;
	subscription_status: 'active' | 'inactive';
	user_id: number | string;
};

export type StatsAppPurchasesResponse = StatsAppPurchase[];

export const statsAppPurchasesQuery = ( params: StatsAppPurchasesParams = {} ) =>
	statsAppProxyQuery< StatsAppPurchasesResponse >( {
		name: 'purchases',
		version: '1.2',
		endpoint: 'upgrades',
		params,
	} );
