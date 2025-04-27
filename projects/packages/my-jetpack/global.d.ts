declare module '*.png';
declare module '*.svg';
declare module '*.jpeg';
declare module '*.jpg';
declare module '*.scss';

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
	| 'can_upgrade'
	| 'needs_attention'
	| 'expired'
	| 'expiring';

type JetpackModule =
	| 'anti-spam'
	| 'backup'
	| 'boost'
	| 'crm'
	| 'creator'
	| 'extras'
	| 'ai'
	| 'jetpack-ai'
	| 'protect'
	| 'scan'
	| 'search'
	| 'social'
	| 'stats'
	| 'videopress'
	| 'security'
	| 'growth'
	| 'complete'
	| 'site-accelerator'
	| 'newsletter'
	| 'related-posts'
	| 'brute-force';

type JetpackModuleWithCard =
	| 'anti-spam'
	| 'backup'
	| 'boost'
	| 'crm'
	| 'jetpack-ai'
	| 'protect'
	| 'search'
	| 'social'
	| 'stats'
	| 'videopress';

type ThreatItem = {
	// Protect API properties (free plan)
	id: string;
	title: string;
	fixed_in: string;
	description: string | null;
	source: string | null;
	// Scan API properties (paid plan)
	context: string | null;
	filename: string | null;
	first_detected: string | null;
	fixable: boolean | null;
	severity: number | null;
	signature: string | null;
	status: number | null;
};

type ScanItem = {
	checked: boolean;
	name: string;
	slug: string;
	threats: ThreatItem[];
	type: string;
	version: string;
};

type RewindStatus =
	| 'missing_plan'
	| 'no_connected_jetpack'
	| 'no_connected_jetpack_with_credentials'
	| 'vp_active_on_site'
	| 'vp_can_transfer'
	| 'host_not_supported'
	| 'multisite_not_supported'
	| 'no_site_found';

type BackupStatus =
	| 'started'
	| 'finished'
	| 'no-credentials'
	| 'backups-deactivated'
	| 'no-credentials-atomic'
	| 'credential-error'
	| 'http-only-error'
	| 'not-accessible'
	| 'backup-deactivated'
	| 'Kill switch active'
	| 'error'
	| 'error-will-retry';

type JetpackPlanSlug =
	| 'jetpack_premium'
	| 'jetpack_business'
	| 'jetpack_free'
	| 'jetpack_premium_monthly'
	| 'jetpack_business_monthly'
	| 'jetpack_personal'
	| 'jetpack_personal_monthly'
	| 'jetpack_security_daily'
	| 'jetpack_security_daily_monthly'
	| 'jetpack_security_realtime'
	| 'jetpack_security_realtime_monthly'
	| 'jetpack_growth_bi_yearly'
	| 'jetpack_growth_yearly'
	| 'jetpack_growth_monthly'
	| 'jetpack_complete_bi_yearly'
	| 'jetpack_complete'
	| 'jetpack_complete_monthly'
	| 'jetpack_security_t1_bi_yearly'
	| 'jetpack_security_t1_yearly'
	| 'jetpack_security_t1_monthly'
	| 'jetpack_security_t2_yearly'
	| 'jetpack_security_t2_monthly'
	| 'jetpack_starter_yearly'
	| 'jetpack_starter_monthly'
	| 'jetpack_backup_daily'
	| 'jetpack_backup_daily_monthly'
	| 'jetpack_backup_realtime'
	| 'jetpack_backup_realtime_monthly'
	| 'jetpack_search_bi_yearly'
	| 'jetpack_search'
	| 'jetpack_search_monthly'
	| 'jetpack_scan_bi_yearly'
	| 'jetpack_scan'
	| 'jetpack_scan_monthly'
	| 'jetpack_scan_realtime'
	| 'jetpack_scan_realtime_monthly'
	| 'jetpack_anti_spam_bi_yearly'
	| 'jetpack_anti_spam'
	| 'jetpack_anti_spam_monthly'
	| 'jetpack_backup_t1_bi_yearly'
	| 'jetpack_backup_t1_yearly'
	| 'jetpack_backup_t1_monthly'
	| 'jetpack_backup_t2_yearly'
	| 'jetpack_backup_t2_monthly'
	| 'jetpack_backup_addon_storage_10gb_monthly'
	| 'jetpack_backup_addon_storage_100gb_monthly'
	| 'jetpack_backup_addon_storage_1tb_monthly'
	| 'jetpack_backup_addon_storage_3tb_monthly'
	| 'jetpack_backup_addon_storage_5tb_monthly'
	| 'jetpack_videopress_bi_yearly'
	| 'jetpack_videopress'
	| 'jetpack_videopress_monthly'
	| 'jetpack_backup_t0_yearly'
	| 'jetpack_backup_t0_monthly'
	| 'jetpack_search_free'
	| 'jetpack_backup_one_time'
	| 'jetpack_stats_free_yearly'
	| 'jetpack_stats_pwyw_yearly'
	| 'jetpack_stats_monthly'
	| 'jetpack_stats_yearly'
	| 'jetpack_stats_bi_yearly'
	| 'jetpack_monitor_monthly'
	| 'jetpack_monitor_yearly'
	| 'jetpack_boost_bi_yearly'
	| 'jetpack_boost_yearly'
	| 'jetpack_boost_monthly'
	| 'jetpack_ai_monthly'
	| 'jetpack_ai_yearly'
	| 'jetpack_ai_bi_yearly'
	| 'jetpack_social_monthly'
	| 'jetpack_social_basic_bi_yearly'
	| 'jetpack_social_basic_yearly'
	| 'jetpack_social_basic_monthly'
	| 'jetpack_social_advanced_bi_yearly'
	| 'jetpack_social_advanced_yearly'
	| 'jetpack_social_advanced_monthly'
	| 'jetpack_golden_token_lifetime'
	| 'jetpack_creator_monthly'
	| 'jetpack_creator_yearly'
	| 'jetpack_creator_bi_yearly'
	| 'jetpack_social_v1_monthly'
	| 'jetpack_social_v1_yearly'
	| 'jetpack_social_v1_bi_yearly';

type BadInstallPluginSlug =
	| 'jetpack-beta'
	| 'jetpack-videopress'
	| 'jetpack-boost'
	| 'jetpack-protect'
	| 'jetpack-crm'
	| 'jetpack-search'
	| 'vaultpress'
	| 'jetpack-social'
	| 'jetpack'
	| 'jetpack-starter'
	| 'jetpack-vaultpress-backup';

type JetpackPluginDisplayName =
	| 'Jetpack Beta'
	| 'Jetpack VideoPress'
	| 'Jetpack Boost'
	| 'Jetpack Protect'
	| 'Jetpack CRM'
	| 'Jetpack Search'
	| 'VaultPress'
	| 'Jetpack Social'
	| 'Jetpack'
	| 'Jetpack Starter'
	| 'Jetpack VaultPress Backup';

type JetpackProductName =
	| 'Security Bundle'
	| 'CRM'
	| 'Newsletter'
	| 'Site Accelerator'
	| 'Social'
	| 'VideoPress'
	| 'Related Posts'
	| 'Starter'
	| 'Stats'
	| 'Akismet Anti-spam'
	| 'Growth Bundle'
	| 'Search'
	| 'AI'
	| 'VaultPress Backup'
	| 'Boost'
	| 'Extras'
	| 'Complete Bundle'
	| 'Protect'
	| 'Creator'
	| 'Scan';

type PurchaseProductName =
	| 'Jetpack Premium'
	| 'Jetpack Personal'
	| 'Jetpack Free'
	| 'Jetpack Professional'
	| 'Jetpack Security Daily'
	| 'Jetpack Security Real-time'
	| 'Jetpack Complete'
	| 'Jetpack Security (10GB)'
	| 'Jetpack Security (1TB)'
	| 'Jetpack Growth'
	| 'Jetpack Starter'
	| 'Jetpack Creator'
	| 'Jetpack Search Free'
	| 'Jetpack Search'
	| 'Jetpack Scan Daily'
	| 'Jetpack Scan Realtime'
	| 'Jetpack Akismet Anti-spam'
	| 'Jetpack VaultPress Backup (1GB)'
	| 'Jetpack VaultPress Backup (10GB)'
	| 'Jetpack VaultPress Backup (1TB)'
	| 'Jetpack VaultPress Backup (One-time)'
	| 'Jetpack VaultPress Backup Add-on Storage (10GB)'
	| 'Jetpack VaultPress Backup Add-on Storage (100GB)'
	| 'Jetpack Anti-spam'
	| 'Jetpack Backup'
	| 'Jetpack Security'
	| 'Jetpack CRM'
	| 'Jetpack Social'
	| 'Jetpack Boost'
	| 'Jetpack Stats'
	| 'Jetpack Protect'
	| 'Jetpack VideoPress';

type PlanExpirationAlert = {
	product_slug: JetpackPlanSlug;
	product_name?: PurchaseProductName;
	expiry_date?: string;
	expiry_message?: string;
	manage_url?: string;
	products_effected?: JetpackProductName[];
};

type PlanExpiredAlerts = Record< `${ JetpackPlanSlug }--plan_expired`, PlanExpirationAlert >;

type MissingConnectionAlertData = {
	type: 'site' | 'user';
	is_error: boolean;
};

type MissingConnectionAlert = Record< 'missing-connection', MissingConnectionAlertData >;

type WelcomeBannerActiveAlert = Record< 'welcome-banner-active', null >;

type BackupFailureAlertData = {
	type: 'warning' | 'error';
	data: BackupNeedsAttentionData;
};

type BackupFailureAlert = Record< 'backup_failure', BackupFailureAlertData >;

type ProtectHasThreatsAlertData = {
	type: 'warning' | 'error';
	data: ProtectNeedsAttentionData;
};

type ProtectHasThreatsAlert = Record< 'protect_has_threats', ProtectHasThreatsAlertData >;

type PluginsNeedingInstallAlertData = {
	needs_installed?: JetpackModule[];
	needs_activated_only?: JetpackModule[];
};

type PluginsNeedingInstallAlert = Record<
	`${ JetpackPlanSlug }--plugins_needing_installed_activated`,
	PluginsNeedingInstallAlertData
>;

type RedBubbleAlerts = MissingConnectionAlert &
	WelcomeBannerActiveAlert &
	PlanExpiredAlerts &
	BackupFailureAlert &
	ProtectHasThreatsAlert &
	PluginsNeedingInstallAlert;

type BackupNeedsAttentionData = {
	source: 'rewind' | 'last_backup';
	status: RewindStatus | BackupStatus;
	last_updated: string;
};

type ProtectNeedsAttentionData = {
	threat_count: number;
	critical_threat_count: number;
	fixable_threat_ids: number[];
};

type Purchase = {
	ID: string;
	user_id: string;
	blog_id: string;
	product_id: string;
	subscribed_date: string;
	renew: string;
	auto_renew: string;
	renew_date: string;
	inactive_date: string | null;
	active: string;
	meta: string | object;
	ownership_id: string;
	most_recent_renew_date: string;
	amount: number;
	expiry_date: string;
	expiry_message: string;
	expiry_sub_message: string;
	expiry_status: string;
	partner_name: string | null;
	partner_slug: string | null;
	partner_key_id: string | null;
	subscription_status: string;
	product_name: string;
	product_slug: string;
	product_type: string;
	blog_created_date: string;
	blogname: string;
	domain: string;
	description: string;
	attached_to_purchase_id: string | null;
	included_domain: string;
	included_domain_purchase_amount: number;
	currency_code: string;
	currency_symbol: string;
	renewal_price_tier_slug: string | null;
	renewal_price_tier_usage_quantity: number | null;
	current_price_tier_slug: string | null;
	current_price_tier_usage_quantity: number | null;
	price_tier_list: Array< object >;
	price_text: string;
	bill_period_label: string;
	bill_period_days: number;
	regular_price_text: string;
	regular_price_integer: number;
	product_display_price: string;
	price_integer: number;
	is_cancelable: boolean;
	can_explicit_renew: boolean;
	can_disable_auto_renew: boolean;
	can_reenable_auto_renewal: boolean;
	iap_purchase_management_link: string | null;
	is_iap_purchase: boolean;
	is_locked: boolean;
	is_refundable: boolean;
	refund_period_in_days: number;
	is_renewable: boolean;
	is_renewal: boolean;
	has_private_registration: boolean;
	refund_amount: number;
	refund_integer: number;
	refund_currency_symbol: string;
	refund_text: string;
	refund_options: object | null;
	total_refund_amount: number;
	total_refund_integer: number;
	total_refund_currency: string;
	total_refund_text: string;
	check_dns: boolean;
};

type ProtectData = {
	scanData: {
		core: ScanItem;
		current_progress?: string;
		data_source: string;
		database: string[];
		error: boolean;
		error_code?: string;
		error_message?: string;
		files: string[];
		has_unchecked_items: boolean;
		last_checked: string;
		num_plugins_threats: number;
		num_themes_threats: number;
		num_threats: number;
		plugins: ScanItem[];
		status: string;
		themes: ScanItem[];
		threats?: ThreatItem[];
	};
	wafConfig: {
		automatic_rules_available: boolean;
		blocked_logins: number;
		bootstrap_path: string;
		brute_force_protection: boolean;
		jetpack_waf_automatic_rules: '1' | '';
		jetpack_waf_ip_allow_list: '1' | '';
		jetpack_waf_ip_block_list: boolean;
		jetpack_waf_ip_list: boolean;
		jetpack_waf_share_data: '1' | '';
		jetpack_waf_share_debug_data: boolean;
		standalone_mode: boolean;
		waf_supported: boolean;
		waf_enabled: boolean;
	};
};

type VideopressData = {
	featuredStats?: {
		label: string;
		period: 'day' | 'year';
		data: {
			views: {
				current: number;
				previous: number;
			};
			impressions: {
				current: number;
				previous: number;
			};
			watch_time: {
				current: number;
				previous: number;
			};
		};
	};
	videoCount: number;
};

interface Window {
	myJetpackInitialState?: {
		siteSuffix: string;
		siteUrl: string;
		latestBoostSpeedScores: {
			previousScores: {
				desktop: number;
				mobile: number;
			};
			scores: {
				desktop: number;
				mobile: number;
			};
			theme: string;
			timestamp: number;
		};
		IDCContainerID: string;
		adminUrl: string;
		blogID: string;
		fileSystemWriteAccess: 'yes' | 'no';
		isStatsModuleActive: string;
		canUserViewStats: boolean;
		isUserFromKnownHost: string;
		loadAddLicenseScreen: string;
		myJetpackCheckoutUri: string;
		myJetpackFlags: {
			showFullJetpackStatsCard: boolean;
			videoPressStats: boolean;
		};
		purchaseToken: string;
		lifecycleStats: {
			historicallyActiveModules: JetpackModule[];
			brokenModules: {
				needs_site_connection: JetpackModule[];
				needs_user_connection: JetpackModule[];
			};
			isSiteConnected: boolean;
			isUserConnected: boolean;
			jetpackPlugins: Array< string >;
			modules: Array< string >;
		};
		myJetpackUrl: string;
		myJetpackVersion: string;
		plugins: {
			[ key: string ]: {
				Name: string;
				PluginURI: string;
				Version: string;
				Title: string;
				Description: string;
				Author: string;
				AuthorName: string;
				AuthorURI: string;
				DomainPath: string;
				textDomain: string;
				RequiresPHP: string;
				RequiresWP: string;
				UpdateURI: string;
				Network: boolean;
				active: boolean;
			};
		};
		products: {
			items: {
				[ key: string ]: {
					class: string;
					description: string;
					category: 'security' | 'performance' | 'growth' | 'create' | 'management';
					disclaimers: Array< string[] >;
					features: string[];
					has_free_offering: boolean;
					feature_identifying_paid_plan: string;
					has_paid_plan_for_product: boolean;
					features_by_tier: Array< string >;
					is_bundle: boolean;
					is_feature: boolean;
					is_plugin_active: boolean;
					is_tiered_pricing: boolean;
					is_upgradable: boolean;
					is_upgradable_by_bundle: string[];
					long_description: string;
					manage_url: string;
					name: string;
					plugin_slug: string;
					post_activation_url: string;
					post_checkout_url?: string;
					manage_paid_plan_purchase_url?: string;
					renew_paid_plan_purchase_url?: string;
					pricing_for_ui?: {
						available: boolean;
						wpcom_product_slug: string;
						wpcom_free_product_slug?: string;
						product_term: string;
						currency_code: string;
						full_price: number;
						full_price_per_month?: number;
						discount_price: number;
						discount_price_per_month?: number;
						coupon_discount: number;
						is_introductory_offer: boolean;
						introductory_offer?: {
							cost_per_interval: number;
							interval_count: number;
							interval_unit: string;
							should_prorate_when_offer_ends: boolean;
							transition_after_renewal_count: number;
							usage_limit?: number;
							reason?: {
								errors: {
									introductoryOfferRemovedSubscriptionFound: string[];
								};
							};
						};
						tiers?: {
							[ key: string ]: {
								available: boolean;
								currencyCode: string;
								discountPrice: number;
								discountPricePerMonth?: number;
								fullPrice: number;
								fullPricePerMonth?: number;
								introductoryOffer?: {
									costPerInterval: number;
									intervalCount: number;
									intervalUnit: string;
									shouldProrateWhenOfferEnds: boolean;
									transitionAfterRenewalCount: number;
									usageLimit?: number;
									reason?: {
										errors: {
											introductoryOfferRemovedSubscriptionFound: string[];
										};
									};
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
					slug: JetpackModule;
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
					doesModuleNeedAttention:
						| false
						| {
								type: 'warning' | 'error';
								data: BackupNeedsAttentionData | ProtectNeedsAttentionData;
								status?: BackupStatus | RewindStatus;
						  };
				};
			};
		};
		recommendedModules: {
			modules: JetpackModule[] | null;
			dismissed: boolean;
			isFirstRun: boolean;
		};
		themes: {
			[ key: string ]: {
				Author: string;
				Name: string;
				RequiresPHP: string;
				RequiresWP: string;
				Status: string;
				Template: string;
				TextDomain: string;
				ThemeURI: string;
				Version: string;
				active: boolean;
				is_block_theme: boolean;
			};
		};
		topJetpackMenuItemUrl: string;
		isAtomic: boolean;
		sandboxedDomain: string;
		isDevVersion: boolean;
		userIsAdmin: string;
		isWelcomeTourActive: boolean;
	};
	myJetpackRest?: {
		apiRoot: string;
		apiNonce: string;
	};
}
